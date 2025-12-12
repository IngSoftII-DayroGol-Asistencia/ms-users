import { Test, TestingModule } from '@nestjs/testing';
import { EnterprisePermissionController } from './enterprise-permission.controller';
import { EnterprisePermissionService } from './enterprise-permission.service';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('EnterprisePermissionController', () => {
  let controller: EnterprisePermissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterprisePermissionController],
      providers: [EnterprisePermissionService, OwnerGuard, PrismaService],
    }).compile();

    controller = module.get<EnterprisePermissionController>(EnterprisePermissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
