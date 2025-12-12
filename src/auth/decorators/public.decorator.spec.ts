import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY, Public } from './public.decorator';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(),
}));

describe('Public decorator', () => {
  it('should call SetMetadata with correct key and value', () => {
    const mockSetMetadata = jest.fn();
    (SetMetadata as jest.Mock).mockReturnValue(mockSetMetadata);

    const result = Public();

    expect(SetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
    expect(result).toBe(mockSetMetadata);
  });
});
