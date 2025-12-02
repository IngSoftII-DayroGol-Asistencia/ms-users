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
import { ProfileModule } from './profile/profile.module';
import { UserRelationshipModule } from './user-relationship/user-relationship.module';
import { EnterprisePermissionModule } from './enterprise-permission/enterprise-permission.module';
import { PermissionAssignmentModule } from './permission-assignment/permission-assignment.module';
import { CreateAuditLogDtoTsModule } from './create-audit-log.dto.ts/create-audit-log.dto.ts.module';
import { AuditLogModule } from './audit-log/audit-log.module';

@Module({
  imports: [AppConfigModule, UsersModule, AuthModule, PrismaModule, EnterpriseModule, RolesModule, ProfileModule, UserRelationshipModule, EnterprisePermissionModule, PermissionAssignmentModule, CreateAuditLogDtoTsModule, AuditLogModule],
  controllers: [AppController],
  providers: [AppService, UsersService],
})
export class AppModule { }
