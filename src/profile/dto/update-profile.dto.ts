import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Carlos', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Mendoza García', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: '1995-03-15T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: 'Senior Software Developer', required: false })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({ example: 'Engineering', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ example: 'Desarrollador apasionado por la tecnología', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  @IsUrl()
  @IsOptional()
  profilePhotoUrl?: string;

  @ApiProperty({ example: 'profiles/photo-123.jpg', required: false })
  @IsString()
  @IsOptional()
  profilePhotoKey?: string;

  @ApiProperty({ example: '+573001234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'María García', required: false })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiProperty({ example: '+573009876543', required: false })
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiProperty({ example: 'Colombia', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'Bogotá', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Calle 100 #15-20', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '110111', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'America/Bogota', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: 'es', required: false })
  @IsString()
  @IsOptional()
  language?: string;
}
