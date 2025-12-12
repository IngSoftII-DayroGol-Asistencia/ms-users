import { validate } from 'class-validator';
import { GetUserDto } from './getUser.dto';

describe('GetUserDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new GetUserDto();
    dto.id = '123';
    dto.email = 'carlos.mendoza@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with empty object', async () => {
    const dto = new GetUserDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with partial data', async () => {
    const dto = new GetUserDto();
    dto.id = '123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid data types', async () => {
    const dto = new GetUserDto();
    dto.id = 123 as any; // Invalid type

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(error => error.property === 'id')).toBe(true);
  });
});
