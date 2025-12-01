import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppConfig,
  DatabaseConfig,
  JwtConfig,
  BcryptConfig
} from './config.interface';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) { }

  get app(): AppConfig {
    return {
      port: this.configService.get<number>('app.port')!,
      environment: this.configService.get<string>('app.environment')!,
      apiPrefix: this.configService.get<string>('app.apiPrefix')!,
    };
  }

  get database(): DatabaseConfig {
    return {
      url: this.configService.get<string>('database.url')!,
    };
  }

  get jwt(): JwtConfig {
    return {
      accessSecret: this.configService.get<string>('jwt.accessSecret')!,
      refreshSecret: this.configService.get<string>('jwt. refreshSecret')!,
      accessExpiresIn: this.configService.get<string>('jwt. accessExpiresIn')!,
      refreshExpiresIn: this.configService.get<string>('jwt.refreshExpiresIn')!,
    };
  }

  get bcrypt(): BcryptConfig {
    return {
      saltRounds: this.configService.get<number>('bcrypt.saltRounds')!,
    };
  }

  get isDevelopment(): boolean {
    return this.app.environment === 'development';
  }

  get isProduction(): boolean {
    return this.app.environment === 'production';
  }

  get isTest(): boolean {
    return this.app.environment === 'test';
  }
}
