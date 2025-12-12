import { createParamDecorator, ExecutionContext } from '@nestjs/common';

jest.mock('@nestjs/common', () => ({
  createParamDecorator: jest.fn(),
}));

describe('CurrentUser decorator', () => {
  let factoryFn: Function;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock createParamDecorator to capture the factory function
    (createParamDecorator as jest.Mock).mockImplementation((factory) => {
      factoryFn = factory;
      return jest.fn();
    });

    // Import the decorator after mocking to capture the factory function
    require('./current-user.decorator');
  });

  it('should call createParamDecorator with a factory function', () => {
    expect(createParamDecorator).toHaveBeenCalledWith(expect.any(Function));
    expect(factoryFn).toBeDefined();
  });

  it('should return user from request when no data parameter', () => {
    const mockRequest = { user: { id: '1', email: 'test@example.com' } };
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    const result = factoryFn(undefined, mockContext);

    expect(result).toEqual(mockRequest.user);
  });

  it('should return specific user property when data parameter provided', () => {
    const mockRequest = { user: { id: '1', email: 'test@example.com' } };
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    const result = factoryFn('email', mockContext);

    expect(result).toBe('test@example.com');
  });

  it('should return null when no user in request', () => {
    const mockRequest = {};
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    const result = factoryFn(undefined, mockContext);

    expect(result).toBeNull();
  });
});
