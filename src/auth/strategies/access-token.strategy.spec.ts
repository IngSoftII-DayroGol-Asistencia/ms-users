import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessTokenStrategy } from './access-token.strategy';

describe('AccessTokenStrategy', () => {
  let strategy: AccessTokenStrategy;
  let configService: ConfigService;
  let prismaService: PrismaService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('test-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    strategy = module.get<AccessTokenStrategy>(AccessTokenStrategy);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate payload and return user', async () => {
    const payload = {
      email: 'test@example.com',
      id: '1',
      phoneNumber: '1234567890',
    };

    const user = {
      id: '1',
      email: 'test@example.com',
      isActive: true,
    };

    mockPrismaService.user.findUnique.mockResolvedValue(user);
    mockConfigService.get.mockReturnValue('secret');

    const result = await strategy.validate(payload);

    expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: payload.id },
      select: { id: true, email: true, isActive: true },
    });
    expect(result).toEqual(payload);
  });

  it('should throw UnauthorizedException for inactive user', async () => {
    const payload = {
      email: 'test@example.com',
      id: '1',
      phoneNumber: '1234567890',
    };

    const user = {
      id: '1',
      email: 'test@example.com',
      isActive: false,
    };

    mockPrismaService.user.findUnique.mockResolvedValue(user);

    await expect(strategy.validate(payload)).rejects.toThrow('User not found or inactive');
  });

  it('should throw UnauthorizedException for non-existent user', async () => {
    const payload = {
      email: 'test@example.com',
      id: '1',
      phoneNumber: '1234567890',
    };

    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow('User not found or inactive');
  });
});
