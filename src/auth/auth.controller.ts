import { Controller, Request, UseGuards, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiHeader, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ status: 404, description: 'Não encontrado.' })
  @ApiResponse({ status: 201, description: 'Recurso criado' })
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Autenticar usuário' })
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @ApiResponse({ status: 404, description: 'Não encontrado.' })
  @ApiResponse({ status: 200, description: 'Tudo certo' })
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT Token',
  })
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Busca usuário autenticado' })
  @Get('test')
  getProfile(@Request() req) {
    return req.user;
  }
}
