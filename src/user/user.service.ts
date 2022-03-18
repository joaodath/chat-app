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
  calculateAge(birthday: Date) {
    // birthday is a date
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const usernameExists = await this.db.user.findUnique({
      where: { username: createUserDto.username },
    });
    if (usernameExists) {
      throw new ConflictException(
        `Username ${createUserDto.username} already exists`,
      );
    }
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
    const userAge = this.calculateAge(new Date(createUserDto.birthDate));
    if (userAge < 18) {
      throw new ConflictException(
        `User must be at least 18 years old to register`,
      );
    }

    const cpfExists = await this.db.user.findMany({
      where: { cpf: createUserDto.cpf },
    });
    if (cpfExists) {
      for (const user of cpfExists) {
        if (user.deleted === false) {
          throw new ConflictException(
            `CPF ${createUserDto.cpf} already exists`,
          );
        }
      }
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return await this.db.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  async findAll(): Promise<User[]> {
    return await this.db.user.findMany();
  }

  // async findUnique(id: number): Promise<User> {
  //   const user = await this.db.user.findUnique({ where: { id } });
  //   if (!user) {
  //     throw new NotFoundException();
  //   }
  //   return user;
  // }

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

  async findByUsernameJWT(username: string): Promise<User> {
    const user = this.db.user.findUnique({ where: { username: username } });
    return user;
  }

  async update(
    username: string,
    updateUserDto: Prisma.UserUpdateInput,
  ): Promise<User> {
    const user = await this.db.user.findUnique({
      where: { username: username },
    });
    if (!user) {
      throw new NotFoundException();
    } else {
      const { cpf, ...userWithoutCPF } = updateUserDto;
      return await this.db.user.update({
        where: { username: username },
        data: userWithoutCPF,
      });
    }
  }

  async remove(username: string): Promise<User> {
    return await this.db.user.delete({ where: { username: username } });
  }

  async softDelete(username: string): Promise<User> {
    const user = await this.db.user.findUnique({
      where: { username: username },
    });

    user.email = 'user deleted';
    user.password = 'user deleted';
    user.profilePhoto = 'user deleted';
    user.phonenumber = 'user deleted';
    user.active = false;
    user.deleted = true;

    await this.db.user.update({
      where: { username: username },
      data: user,
    });

    return await this.db.user.findUnique({
      where: { username: username },
      include: {
        booksBought: true,
        shoppingCart: true,
        shoppingHistory: true,
      },
    });
  }

  async enable(username: string): Promise<User> {
    const user = await this.db.user.findUnique({
      where: { username: username },
    });
    if (user.deleted === false) {
      return await this.db.user.update({
        where: { username: username },
        data: { active: true },
      });
    } else {
      throw new NotFoundException();
    }
  }

  async disable(username: string): Promise<User> {
    const user = await this.db.user.findUnique({
      where: { username: username },
    });
    if (user.deleted === false) {
      return await this.db.user.update({
        where: { username: username },
        data: { active: false },
      });
    } else {
      throw new NotFoundException();
    }
  }
}
