import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType } from '@prisma/client';

export class QueryAuditLogDto {
  @ApiProperty({
    example: 'clxyz1234567890',
    description: 'Filtrar por ID de usuario',
    required: false
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    enum: ResourceType,
    example: ResourceType.USERS,
    description: 'Filtrar por tipo de recurso',
    required: false
  })
  @IsEnum(ResourceType)
  @IsOptional()
  resource?: ResourceType;

  @ApiProperty({
    example: 'CREATE',
    description: 'Filtrar por acción',
    required: false
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha inicial',
    required: false
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Fecha final',
    required: false
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    example: 1,
    description: 'Número de página',
    required: false,
    default: 1
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Cantidad de registros por página',
    required: false,
    default: 20
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
