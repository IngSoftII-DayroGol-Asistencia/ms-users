import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() data: LoginDto) {
    return this.authService.signIn(data);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post("register")
  signUp(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }


}
