import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RevokeEnterprisePermissionDto {
  @ApiProperty({
    example: 'clxyz1234567890',
    description: 'ID del permiso de empresa a revocar'
  })
  @IsString()
  @IsNotEmpty()
  enterprisePermissionId: string;
}
