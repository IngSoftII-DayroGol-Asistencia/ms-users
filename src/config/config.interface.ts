export interface AppConfig {
  port: number;
  environment: string;
  apiPrefix: string;
}

export interface DatabaseConfig {
  url: string;
}

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export interface BcryptConfig {
  saltRounds: number;
}

export interface EnvironmentVariables {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  bcrypt: BcryptConfig;
}
