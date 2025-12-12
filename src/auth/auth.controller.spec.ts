import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signIn: jest.fn(),
    register: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
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

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should call authService.signIn with correct data', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password' };
      const result = { accessToken: 'token', refreshToken: 'refresh' };
      mockAuthService.signIn.mockResolvedValue(result);

      const response = await controller.signIn(loginDto);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(loginDto);
      expect(response).toEqual(result);
    });
  });

  describe('signUp', () => {
    it('should call authService.register with correct data', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        firstName: 'Test',
        lastName: 'User',
      };
      const result = { id: '1', email: 'test@example.com' };
      mockAuthService.register.mockResolvedValue(result);

      const response = await controller.signUp(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(response).toEqual(result);
    });
  });

  describe('refreshTokens', () => {
    it('should call authService.refreshTokens with correct data', async () => {
      const req = { user: { id: '1', refreshToken: 'token' } };
      const result = { accessToken: 'newToken', refreshToken: 'newRefresh' };
      mockAuthService.refreshTokens.mockResolvedValue(result);

      const response = await controller.refreshTokens(req);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('1', 'token');
      expect(response).toEqual(result);
    });
  });

  describe('verify', () => {
    it('should return user info from request', () => {
      const req = { user: { id: '1', email: 'test@example.com' } };

      const response = controller.verify(req);

      expect(response).toEqual({ userId: '1', email: 'test@example.com' });
    });
  });

  describe('logout', () => {
    it('should call authService.logout with correct user id', async () => {
      const req = { user: { id: '1' } };
      const result = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(result);

      const response = await controller.logout(req);

      expect(mockAuthService.logout).toHaveBeenCalledWith('1');
      expect(response).toEqual(result);
    });
  });

  describe('logoutAll', () => {
    it('should call authService.logoutAll with correct user id', async () => {
      const req = { user: { id: '1' } };
      const result = { message: 'Logged out from all devices successfully' };
      mockAuthService.logoutAll.mockResolvedValue(result);

      const response = await controller.logoutAll(req);

      expect(mockAuthService.logoutAll).toHaveBeenCalledWith('1');
      expect(response).toEqual(result);
    });
  });
});
