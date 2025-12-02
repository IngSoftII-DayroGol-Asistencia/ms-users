import { Module } from '@nestjs/common';
import { PermissionAssignmentController } from './permission-assignment.controller';
import { PermissionAssignmentService } from './permission-assignment.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [PermissionAssignmentController],
  providers: [PermissionAssignmentService],
  imports: [PrismaModule],
  exports: [PermissionAssignmentService]
})
export class PermissionAssignmentModule { }
