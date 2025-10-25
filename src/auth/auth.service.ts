import { HttpException, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Prisma, User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  logger: Logger
  constructor(private readonly dataSource: PrismaService, private readonly userService: UsersService) {
    this.logger = new Logger(AuthService.name);
  }

  async register(data: RegisterDto): Promise<User> {
    try {
      const user = await this.dataSource.user.create({
        data: {
          email: data.email,
          password: data.password,
          phone: data.phone,
          isActive: true,
          isVerified: false,
        }
      });
      await this.userService.createUser(data, user.id, data.phone);
      return user;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException("Error registrating user", 400);
    }
  }

  async signIn(data: LoginDto) {

  }

}
