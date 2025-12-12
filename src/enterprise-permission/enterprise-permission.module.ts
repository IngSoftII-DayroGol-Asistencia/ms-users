import { Module } from '@nestjs/common';
import { EnterprisePermissionService } from './enterprise-permission.service';
import { EnterprisePermissionController } from './enterprise-permission.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [EnterprisePermissionService],
  controllers: [EnterprisePermissionController],
  imports: [PrismaModule],
  exports: [EnterprisePermissionService]
})
export class EnterprisePermissionModule { }
