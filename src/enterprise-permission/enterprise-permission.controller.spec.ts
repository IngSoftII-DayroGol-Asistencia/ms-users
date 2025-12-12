import { Test, TestingModule } from '@nestjs/testing';
import { EnterprisePermissionController } from './enterprise-permission.controller';

describe('EnterprisePermissionController', () => {
  let controller: EnterprisePermissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterprisePermissionController],
    }).compile();

    controller = module.get<EnterprisePermissionController>(EnterprisePermissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
