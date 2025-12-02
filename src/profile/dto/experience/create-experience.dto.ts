import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { EmploymentType, ExperienceLevel } from '@prisma/client';

export class CreateExperienceDto {
  @ApiProperty({ example: 'Google' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiProperty({
    example: 'Desarrollo de microservicios y arquitectura cloud',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: EmploymentType, example: EmploymentType.FULL_TIME })
  @IsEnum(EmploymentType)
  @IsNotEmpty()
  employmentType: EmploymentType;

  @ApiProperty({ enum: ExperienceLevel, example: ExperienceLevel.SENIOR, required: false })
  @IsEnum(ExperienceLevel)
  @IsOptional()
  experienceLevel?: ExperienceLevel;

  @ApiProperty({ example: '2020-01-15T00:00:00. 000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2023-06-30T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @ApiProperty({ example: 'Mountain View, California', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: ['TypeScript', 'Kubernetes', 'GCP'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiProperty({ example: 'Lideré la migración a microservicios reduciendo costos en 40%', required: false })
  @IsString()
  @IsOptional()
  achievements?: string;
}
