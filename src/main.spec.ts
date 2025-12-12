import { Test, TestingModule } from '@nestjs/testing';
import { bootstrap } from './main';

jest.mock('./app.module', () => ({
  AppModule: jest.fn(),
}));

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      enableCors: jest.fn(),
      listen: jest.fn(),
    }),
  },
}));

jest.mock('@nestjs/swagger', () => ({
  SwaggerModule: {
    createDocument: jest.fn(),
    setup: jest.fn(),
  },
  DocumentBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    addBearerAuth: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  })),
  ApiResponse: jest.fn(),
  ApiBearerAuth: jest.fn(),
  ApiTags: jest.fn(),
  ApiOperation: jest.fn(),
}));

describe('Main (bootstrap)', () => {
  let mockApp: any;

  beforeEach(() => {
    mockApp = {
      enableCors: jest.fn(),
      listen: jest.fn(),
    };

    const { NestFactory } = require('@nestjs/core');
    NestFactory.create.mockResolvedValue(mockApp);

    const { SwaggerModule } = require('@nestjs/swagger');
    SwaggerModule.createDocument.mockReturnValue({});
  });

  it('should bootstrap the application with Swagger and CORS', async () => {
    await bootstrap();

    const { NestFactory } = require('@nestjs/core');
    expect(NestFactory.create).toHaveBeenCalled();

    const { SwaggerModule } = require('@nestjs/swagger');
    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api', mockApp, {});

    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith(process.env.PORT ?? 3000);
  });
});
