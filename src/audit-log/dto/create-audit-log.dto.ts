import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ResourceType } from '@prisma/client';

export class CreateAuditLogDto {
  @ApiProperty({
    example: 'CREATE',
    description: 'Acción realizada (CREATE, UPDATE, DELETE, LOGIN, etc.)'
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    enum: ResourceType,
    example: ResourceType.USERS,
    description: 'Tipo de recurso afectado'
  })
  @IsEnum(ResourceType)
  @IsNotEmpty()
  resource: ResourceType;

  @ApiProperty({
    example: 'clxyz1234567890',
    description: 'ID del recurso afectado (opcional)',
    required: false
  })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiProperty({
    example: { before: { name: 'Old' }, after: { name: 'New' } },
    description: 'Cambios realizados en formato JSON (opcional)',
    required: false
  })
  @IsOptional()
  changes?: Record<string, any>;
}
