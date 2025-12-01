import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { RolesModule } from './roles/roles.module';
import { AppConfigModule } from './config';

@Module({
  imports: [AppConfigModule, UsersModule, AuthModule, PrismaModule, EnterpriseModule, RolesModule],
  controllers: [AppController],
  providers: [AppService, UsersService],
})
export class AppModule { }
