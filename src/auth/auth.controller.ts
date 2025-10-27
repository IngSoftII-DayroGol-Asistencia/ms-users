import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth, ApiResetContentResponse, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiResponse({ status: HttpStatus.OK, description: "Ingresar con un usuario registrado" })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() data: LoginDto) {
    return this.authService.signIn(data);
  }

  @ApiResponse({ status: HttpStatus.CREATED, description: "Create a new user" })
  @HttpCode(HttpStatus.CREATED)
  @Post("register")
  signUp(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @ApiBearerAuth('Bearer')
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: "Verify JWT" })
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthGuard)
  @Get('verify')
  verify(@Req() req: any) {
    return {
      userId: req.user.id,
      email: req.user.email,
    };
  }

}
