import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateEnterpriseDto {
  @ApiProperty({ example: 'Tech Solutions S.A. S' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Empresa de desarrollo de software especializada en soluciones cloud',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://example. com/logo.png',
    required: false
  })
  @IsUrl()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    example: 'https://techsolutions.com',
    required: false
  })
  @IsUrl()
  @IsOptional()
  website?: string;
}
