import { Test, TestingModule } from '@nestjs/testing';
import { PermissionAssignmentController } from './permission-assignment.controller';

describe('PermissionAssignmentController', () => {
  let controller: PermissionAssignmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionAssignmentController],
    }).compile();

    controller = module.get<PermissionAssignmentController>(PermissionAssignmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
