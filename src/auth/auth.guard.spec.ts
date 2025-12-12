import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid token', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer validToken',
        },
      };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      };

      const payload = { userId: '1', email: 'test@example.com' };
      mockConfigService.get.mockReturnValue('secret');
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await guard.canActivate(mockContext as any);

      expect(result).toBe(true);
      expect(mockRequest['user']).toEqual(payload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('validToken', {
        secret: 'secret',
      });
    });

    it('should throw UnauthorizedException for missing token', async () => {
      const mockRequest = {
        headers: {},
      };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      };

      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalidToken',
        },
      };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      };

      mockConfigService.get.mockReturnValue('secret');
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong token type', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Basic token',
        },
      };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      };

      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer testToken',
        },
      };

      const result = (guard as any).extractTokenFromHeader(mockRequest);

      expect(result).toBe('testToken');
    });

    it('should return undefined for non-Bearer header', () => {
      const mockRequest = {
        headers: {
          authorization: 'Basic testToken',
        },
      };

      const result = (guard as any).extractTokenFromHeader(mockRequest);

      expect(result).toBeUndefined();
    });

    it('should return undefined for missing authorization header', () => {
      const mockRequest = {
        headers: {},
      };

      const result = (guard as any).extractTokenFromHeader(mockRequest);

      expect(result).toBeUndefined();
    });
  });
});
