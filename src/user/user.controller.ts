import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Request,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Prisma } from '.prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { userWithoutPasswordDto } from './dto/user-without-password.dto';
import { ApiTags, ApiHeader, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: 409,
    description: 'Conflito de dados. Revise dados enviados.',
  })
  @ApiResponse({ status: 201, description: 'Recurso criado' })
  @ApiOperation({ summary: 'Criar Usuário' })
  @Post('new')
  @UsePipes(ValidationPipe)
  async create(
    @Request() req,
    @Body() createUserDto: CreateUserDto,
  ): Promise<userWithoutPasswordDto> {
    if (req.headers.authorization) {
      throw new ConflictException();
    } else {
      return await this.userService.create(createUserDto);
    }
  }

  @ApiResponse({ status: 404, description: 'Não encontrado.' })
  @ApiResponse({ status: 200, description: 'Tudo certo' })
  @ApiOperation({ summary: 'Encontrar todos os usuários' })
  @Get('all')
  @UsePipes(ValidationPipe)
  async findAll(): Promise<userWithoutPasswordDto[]> {
    return await this.userService.findAll();
  }

  @ApiHeader({
    name: 'Authorization',
    description: 'JWT Token',
  })
  @ApiResponse({ status: 404, description: 'User not found!' })
  @ApiResponse({ status: 200, description: 'User found!' })
  @ApiOperation({
    summary:
      'Search for users using their username. The route is protected by JWT auth',
  })
  @Get('username/:username')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async findByUsername(@Request() req): Promise<userWithoutPasswordDto> {
    return await this.userService.findByUsername(req.user.username);
  }

  @ApiHeader({
    name: 'Authorization',
    description: 'JWT Token',
  })
  @ApiResponse({ status: 404, description: 'Não encontrado.' })
  @ApiResponse({ status: 200, description: 'Tudo certo' })
  @ApiOperation({ summary: 'Editar informações do Usuário' })
  @Patch('update')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async update(
    @Request() req,
    @Body() updateUserDto: Prisma.UserUpdateInput,
  ): Promise<userWithoutPasswordDto> {
    return await this.userService.update(req.user.username, updateUserDto);
  }

  @ApiHeader({
    name: 'Authorization',
    description: 'JWT Token',
  })
  @ApiResponse({ status: 404, description: 'Não encontrado.' })
  @ApiResponse({ status: 200, description: 'Tudo certo' })
  @ApiOperation({ summary: 'Soft Delete de Usuário' })
  @Patch('softdelete')
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  async softDelete(@Request() req): Promise<userWithoutPasswordDto> {
    return await this.userService.softDelete(req.user.username);
  }

  @ApiResponse({ status: 404, description: 'Não encontrado.' })
  @ApiResponse({ status: 200, description: 'Tudo certo' })
  @ApiOperation({ summary: 'Hard Delete de Usuário' })
  @Delete('del/:username')
  @UsePipes(ValidationPipe)
  async remove(
    @Param('username') username: string,
  ): Promise<userWithoutPasswordDto> {
    return await this.userService.hardDelete(username);
  }
}
