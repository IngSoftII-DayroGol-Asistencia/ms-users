import { Module } from '@nestjs/common';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [EnterpriseController],
  providers: [EnterpriseService],
  imports: [PrismaModule],
  exports: [EnterpriseService]
})
export class EnterpriseModule { }
