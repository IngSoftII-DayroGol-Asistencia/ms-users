import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdatePermissionAssignmentDto {
  @ApiProperty({
    example: '2026-12-31T23:59:59.  000Z',
    description: 'Nueva fecha de expiración (null para remover expiración)',
    required: false
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string | null;
}
