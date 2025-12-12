import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditLogService } from '../audit-log/audit-log.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let auditLogService: AuditLogService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    authToken: {
      updateMany: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUsersService = {
    createUser: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockAuditLogService = {
    // Add any methods if needed
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        firstName: 'Test',
        lastName: 'User',
      };
      const createdUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        phone: '1234567890',
        isActive: true,
        isVerified: false,
      };

      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockUsersService.createUser.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password: expect.any(String), // hashed password
          phone: registerDto.phone,
          isActive: true,
          isVerified: false,
        },
      });
      expect(mockUsersService.createUser).toHaveBeenCalledWith(registerDto, createdUser.id, registerDto.phone);
      expect(result).toEqual(createdUser);
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = {
        id: '1',
        email: 'test@example.com',
        password: '$2b$10$hashedpassword', // bcrypt hash
        phone: '1234567890',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockConfigService.get.mockReturnValue('secret');
      mockJwtService.signAsync.mockResolvedValueOnce('accessToken').mockResolvedValueOnce('refreshToken');
      mockPrismaService.authToken.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.authToken.create.mockResolvedValue(undefined);
      mockPrismaService.user.update.mockResolvedValue(undefined);

      const result = await service.signIn(loginDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(result).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginDto: LoginDto = {
        email: 'invalid@example.com',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.signIn(loginDto)).rejects.toThrow('Error on login');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const userId = '1';
      const refreshToken = 'validRefreshToken';
      const user = {
        id: '1',
        email: 'test@example.com',
        phone: '1234567890',
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.authToken.findMany.mockResolvedValue([
        { id: '1', token: '$2b$10$hashedToken', revokedAt: null, expiresAt: new Date(Date.now() + 100000) },
      ]);
      mockConfigService.get.mockReturnValue('secret');
      mockJwtService.signAsync.mockResolvedValueOnce('newAccessToken').mockResolvedValueOnce('newRefreshToken');
      mockPrismaService.authToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.authToken.create.mockResolvedValue(undefined);

      const result = await service.refreshTokens(userId, refreshToken);

      expect(result).toEqual({ accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = '1';

      mockPrismaService.authToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout(userId);

      expect(mockPrismaService.authToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          type: 'REFRESH',
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('logoutAll', () => {
    it('should logout all devices successfully', async () => {
      const userId = '1';

      mockPrismaService.authToken.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.logoutAll(userId);

      expect(mockPrismaService.authToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
      expect(result).toEqual({ message: 'Logged out from all devices successfully' });
    });
  });
});
