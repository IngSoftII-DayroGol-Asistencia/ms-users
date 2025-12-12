import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BulkAssignPermissionsDto {
  @ApiProperty({
    example: ['clxyz123', 'clxyz456', 'clxyz789'],
    description: 'Array de IDs de permisos a asignar'
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  permissionIds: string[];

  @ApiProperty({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Fecha de expiración para todos los permisos (opcional)',
    required: false
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
