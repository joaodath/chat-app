import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsernameJWT(username);
    if (user) {
      const isValidPassword = await bcrypt.compare(pass, user.password);
      if (
        user.username === username &&
        isValidPassword &&
        user.deleted === false
      ) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    await this.usersService.enable(user.username);
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
