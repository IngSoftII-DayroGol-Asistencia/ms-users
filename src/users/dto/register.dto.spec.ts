import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new RegisterDto();
    dto.email = 'carlos.mendoza@example.com';
    dto.password = 'SecurePass123!';
    dto.firstName = 'Carlos';
    dto.lastName = 'Mendoza García';
    dto.dateOfBirth = '1995-03-15T00:00:00.000Z';
    dto.jobTitle = 'Senior Software Developer';
    dto.department = 'Engineering';
    dto.bio = 'Desarrollador full-stack con 5 años de experiencia en NestJS y React. Apasionado por la arquitectura de software y las buenas prácticas.';
    dto.profilePhotoUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200';
    dto.profilePhotoKey = 'profiles/carlos-mendoza-2024.jpg';
    dto.emergencyContact = 'María García López';
    dto.emergencyPhone = '+573115551214';
    dto.country = 'Colombia';
    dto.city = 'Bogotá';
    dto.address = 'Calle 100 #15-20, Apartamento 501';
    dto.postalCode = '110111';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with missing required fields', async () => {
    const dto = new RegisterDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(error => error.property === 'email')).toBe(true);
    expect(errors.some(error => error.property === 'password')).toBe(true);
    expect(errors.some(error => error.property === 'firstName')).toBe(true);
    expect(errors.some(error => error.property === 'lastName')).toBe(true);
  });

  it('should fail validation with invalid email', async () => {
    const dto = new RegisterDto();
    dto.email = 'invalid-email';
    dto.password = 'SecurePass123!';
    dto.firstName = 'Carlos';
    dto.lastName = 'Mendoza García';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(error => error.property === 'email')).toBe(true);
  });

  it('should pass validation with optional fields omitted', async () => {
    const dto = new RegisterDto();
    dto.email = 'carlos.mendoza@example.com';
    dto.password = 'SecurePass123!';
    dto.firstName = 'Carlos';
    dto.lastName = 'Mendoza García';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
