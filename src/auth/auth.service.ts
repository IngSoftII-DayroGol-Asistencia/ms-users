import { HttpException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Prisma, User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { runInThisContext } from 'node:vm';
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  logger: Logger
  constructor(private readonly dataSource: PrismaService, private readonly userService: UsersService, private jwtService: JwtService) {
    this.logger = new Logger(AuthService.name);
  }

  private async hashString(str: string): Promise<string> {
    const saltRounds = 10; // Define the cost factor for hashing
    return await bcrypt.hash(str, saltRounds);
  }

  private async comparePasswords(plain: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(plain, hashed);
  }

  private async payloadInfo(email: string): Promise<User | null> {
    try {
      const user: User | null = await this.dataSource.user.findUnique({
        where: {
          email: email,
        }
      });
      return user;
    } catch (error) {
      this.logger.error("Error getting user");
      throw new HttpException("Error getting user", 401)
    }
  }

  async register(data: RegisterDto): Promise<User> {
    try {
      const user = await this.dataSource.user.create({
        data: {
          email: data.email,
          password: await this.hashString(data.password),
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
    try {
      let payload = await this.payloadInfo(data.email);
      if (payload == null) throw new UnauthorizedException();
      const pass = await this.comparePasswords(data.password, payload.password);
      if (!pass) throw new UnauthorizedException();
      const payloadJwt = { email: payload.email, id: payload.id, phoneNumber: payload.phone };
      return { accesToken: await this.jwtService.signAsync(payload) }
    } catch (error) {
      this.logger.error(error);
      throw new HttpException("Error on login", 401);
    }
  }

}
