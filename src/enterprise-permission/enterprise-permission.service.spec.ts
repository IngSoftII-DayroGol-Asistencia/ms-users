import { Test, TestingModule } from '@nestjs/testing';
import { EnterprisePermissionService } from './enterprise-permission.service';

describe('EnterprisePermissionService', () => {
  let service: EnterprisePermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnterprisePermissionService],
    }).compile();

    service = module.get<EnterprisePermissionService>(EnterprisePermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
