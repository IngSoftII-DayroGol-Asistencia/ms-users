import { Test, TestingModule } from '@nestjs/testing';
import { PermissionAssignmentService } from './permission-assignment.service';

describe('PermissionAssignmentService', () => {
  let service: PermissionAssignmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionAssignmentService],
    }).compile();

    service = module.get<PermissionAssignmentService>(PermissionAssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
