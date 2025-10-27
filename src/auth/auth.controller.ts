import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiResetContentResponse, ApiResponse } from '@nestjs/swagger';

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


}
