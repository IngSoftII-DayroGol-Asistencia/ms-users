import { HttpException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User, TokenType } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogService } from 'src/audit-log/audit-log.service';

@Injectable()
export class AuthService {
  logger: Logger;

  constructor(
    private readonly dataSource: PrismaService,
    private readonly userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditLogService: AuditLogService
  ) {
    this.logger = new Logger(AuthService.name);
  }

  private async hashString(str: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(str, saltRounds);
  }

  private async comparePasswords(plain: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(plain, hashed);
  }

  private async payloadInfo(email: string): Promise<User | null> {
    try {
      const user: User | null = await this.dataSource.user.findUnique({
        where: {
          email: email,
        }
      });
      return user;
    } catch (error) {
      this.logger.error("Error getting user");
      throw new HttpException("Error getting user", 401);
    }
  }

  private async generateTokens(payload: { email: string; id: string; phoneNumber: string | null }) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: 60 * 15, // 15 minutos en segundos
      }),
      this.jwtService.signAsync(
        { ...payload, tokenId: uuidv4() },
        {
          secret: refreshSecret,
          expiresIn: 60 * 60 * 24 * 7, // 7 días en segundos
        }
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await this.hashString(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await this.dataSource.authToken.updateMany({
      where: {
        userId: userId,
        type: TokenType.REFRESH,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await this.dataSource.authToken.create({
      data: {
        userId: userId,
        type: TokenType.REFRESH,
        token: hashedToken,
        expiresAt: expiresAt,
      },
    });
  }

  private async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const tokens = await this.dataSource.authToken.findMany({
      where: {
        userId: userId,
        type: TokenType.REFRESH,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    for (const tokenRecord of tokens) {
      const isValid = await this.comparePasswords(refreshToken, tokenRecord.token);
      if (isValid) {
        return true;
      }
    }

    return false;
  }

  private async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokens = await this.dataSource.authToken.findMany({
      where: {
        userId: userId,
        type: TokenType.REFRESH,
        revokedAt: null,
      },
    });

    for (const tokenRecord of tokens) {
      const isMatch = await this.comparePasswords(refreshToken, tokenRecord.token);
      if (isMatch) {
        await this.dataSource.authToken.update({
          where: { id: tokenRecord.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }
  }

  async register(data: RegisterDto): Promise<User> {
    try {
      const user = await this.dataSource.user.create({
        data: {
          email: data.email,
          password: await this.hashString(data.password),
          phone: data.phone,
          isActive: true,
          isVerified: false,
        }
      });
      await this.userService.createUser(data, user.id, data.phone);
      return user;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException("Error registrating user", 400);
    }
  }

  async signIn(data: LoginDto) {
    try {
      const user = await this.payloadInfo(data.email);
      if (user == null) throw new UnauthorizedException();

      const pass = await this.comparePasswords(data.password, user.password);
      if (!pass) throw new UnauthorizedException();

      const payloadJwt = { email: user.email, id: user.id, phoneNumber: user.phone };
      const tokens = await this.generateTokens(payloadJwt);

      await this.saveRefreshToken(user.id, tokens.refreshToken);

      await this.dataSource.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });


      return tokens;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException("Error on login", 401);
    }
  }

  async refreshTokens(userId: string, refreshToken: string) {
    try {
      const user = await this.dataSource.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Access Denied');
      }

      const isValidToken = await this.validateRefreshToken(userId, refreshToken);

      if (!isValidToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.revokeRefreshToken(userId, refreshToken);

      const payloadJwt = { email: user.email, id: user.id, phoneNumber: user.phone };
      const tokens = await this.generateTokens(payloadJwt);

      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.dataSource.authToken.updateMany({
      where: {
        userId: userId,
        type: TokenType.REFRESH,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.dataSource.authToken.updateMany({
      where: {
        userId: userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Logged out from all devices successfully' };
  }
}
