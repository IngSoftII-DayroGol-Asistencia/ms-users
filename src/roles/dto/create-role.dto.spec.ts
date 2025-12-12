import { validate } from 'class-validator';
import { CreateRoleDto } from './create-role.dto';

describe('CreateRoleDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new CreateRoleDto();
    dto.name = 'Manager';
    dto.description = 'Rol con permisos de gestión de usuarios';
    dto.permissionIds = ['clxyz123', 'clxyz456'];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with minimal data', async () => {
    const dto = new CreateRoleDto();
    dto.name = 'Manager';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with empty name', async () => {
    const dto = new CreateRoleDto();
    dto.name = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing name', async () => {
    const dto = new CreateRoleDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid permissionIds (not array of strings)', async () => {
    const dto = new CreateRoleDto();
    dto.name = 'Manager';
    dto.permissionIds = [123, 456] as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isString');
  });
});
