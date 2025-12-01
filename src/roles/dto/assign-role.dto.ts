import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    example: 'clxyz1234567890',
    description: 'ID del usuario al que se le asignará el rol'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'clxyz0987654321',
    description: 'ID del rol a asignar'
  })
  @IsString()
  @IsNotEmpty()
  roleId: string;
}
