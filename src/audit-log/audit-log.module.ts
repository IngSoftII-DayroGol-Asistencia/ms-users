import { Global, Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  providers: [AuditLogService],
  controllers: [AuditLogController],
  imports: [PrismaModule],
  exports: [AuditLogService]
})
export class AuditLogModule { }
