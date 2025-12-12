import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';

describe('RolesController', () => {
  let controller: RolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        RolesService,
        PrismaService,
        {
          provide: AccessTokenGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: OwnerGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
