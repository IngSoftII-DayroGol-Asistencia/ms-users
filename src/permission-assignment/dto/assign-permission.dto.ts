import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({
    example: 'clxyz1234567890',
    description: 'ID del usuario al que se le asignará el permiso'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'clxyz0987654321',
    description: 'ID del permiso a asignar'
  })
  @IsString()
  @IsNotEmpty()
  permissionId: string;

  @ApiProperty({
    example: '2025-12-31T23:59:59. 000Z',
    description: 'Fecha de expiración del permiso (opcional)',
    required: false
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
