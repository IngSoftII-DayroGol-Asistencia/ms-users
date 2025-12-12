import { Module } from '@nestjs/common';
import { UserRelationshipService } from './user-relationship.service';
import { UserRelationshipController } from './user-relationship.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [UserRelationshipService],
  controllers: [UserRelationshipController],
  imports: [PrismaModule],
  exports: [UserRelationshipService]
})
export class UserRelationshipModule { }
