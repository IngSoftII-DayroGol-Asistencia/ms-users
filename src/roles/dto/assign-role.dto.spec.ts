import { validate } from 'class-validator';
import { AssignRoleDto } from './assign-role.dto';

describe('AssignRoleDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new AssignRoleDto();
    dto.userId = 'clxyz1234567890';
    dto.roleId = 'clxyz0987654321';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with empty userId', async () => {
    const dto = new AssignRoleDto();
    dto.userId = '';
    dto.roleId = 'clxyz0987654321';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with empty roleId', async () => {
    const dto = new AssignRoleDto();
    dto.userId = 'clxyz1234567890';
    dto.roleId = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing userId', async () => {
    const dto = new AssignRoleDto();
    dto.roleId = 'clxyz0987654321';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing roleId', async () => {
    const dto = new AssignRoleDto();
    dto.userId = 'clxyz1234567890';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });
});
