import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma, User } from '.prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { userWithoutPasswordDto } from './dto/user-without-password.dto';
@Injectable()
export class UserService {
  constructor(private db: PrismaService) {}

  //This create function will not return the user's password hash.
  async create(createUserDto: CreateUserDto): Promise<userWithoutPasswordDto> {
    const usernameExists = await this.findByUsername(createUserDto.username);
    if (usernameExists) {
      throw new ConflictException(
        `Username ${createUserDto.username} already exists`,
      );
    }
    //This will check if the email is already registered in the database. Soft deleted users are not considered.
    const emailExists = await this.db.user.findMany({
      where: { email: createUserDto.email },
    });
    if (emailExists) {
      for (const user of emailExists) {
        if (user.deleted === false) {
          throw new ConflictException(
            `Email ${createUserDto.email} already exists`,
          );
        }
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = await this.db.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  //This findAll function will not return the users password hash. :)
  async findAll(): Promise<userWithoutPasswordDto[]> {
    const users = await this.db.user.findMany();
    const usersWithoutPassword: userWithoutPasswordDto[] = [];

    for (const user of users) {
      const { password, ...userWithoutPassword } = user;
      usersWithoutPassword.push(userWithoutPassword);
    }
    return await this.db.user.findMany();
  }

  async findUnique(id: string): Promise<userWithoutPasswordDto> {
    const user = await this.db.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException();
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByUsername(username: string): Promise<userWithoutPasswordDto> {
    const user = await this.db.user.findUnique({
      where: { username: username },
    });
    if (!user) {
      throw new NotFoundException();
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  //INTERNAL USE ONLY: This find function WILL return the user's password hash so JWT can compare and allow login. DO NOT, FOR THE SAKE OF YOUR SOUL, USE THIS FUNCTION TO FIND USERS IN OTHER CONTEXTS.
  async findByUsernameJWT(username: string): Promise<User> {
    const user = this.db.user.findUnique({ where: { username: username } });
    return user;
  }

  async update(
    username: string,
    updateUserDto: Prisma.UserUpdateInput,
  ): Promise<userWithoutPasswordDto> {
    const user = await this.db.user.findUnique({
      where: { username: username },
    });
    if (!user) {
      throw new NotFoundException();
    } else {
      const { isLoggedIn, messages, createdAt, updatedAt, ...userSafeData } =
        updateUserDto;
      const { password, ...userWithoutPassword } = await this.db.user.update({
        where: { username: username },
        data: userSafeData,
      });

      return userWithoutPassword;
    }
  }

  //This can be used to soft delete a user, removing their password and other sensitive data. It also marks the user as deleted, so JWT won't be able to login with it.
  async softDelete(username: string): Promise<userWithoutPasswordDto> {
    const user = await this.db.user.findUnique({
      where: { username: username },
    });

    user.password = '';
    user.deleted = true;

    await this.db.user.update({
      where: { username: username },
      data: user,
    });

    const { isLoggedIn, messages, createdAt, updatedAt, ...userSafeData } =
      await this.findByUsername(username);

    return userSafeData;
  }

  //This will hard delete a user. Making impossible to recover data about them if needed. Messages will be orphaned. This is a very dangerous operation, use with caution!
  async hardDelete(username: string): Promise<userWithoutPasswordDto> {
    const { password, isLoggedIn, createdAt, updatedAt, ...userSafeData } =
      await this.db.user.delete({ where: { username: username } });
    return userSafeData;
  }
}
