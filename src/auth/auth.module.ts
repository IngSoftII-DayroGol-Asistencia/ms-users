import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [UsersModule, PrismaModule]
})
export class AuthModule { }
