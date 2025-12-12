import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinEnterpriseDto {
  @ApiProperty({
    example: 'clxyz1234567890abcdef',
    description: 'ID de la empresa a la que desea unirse'
  })
  @IsString()
  @IsNotEmpty()
  enterpriseId: string;
}
