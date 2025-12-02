import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ExperienceLevel } from '@prisma/client';

export class CreateSkillDto {
  @ApiProperty({ example: 'TypeScript' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ExperienceLevel, example: ExperienceLevel.SENIOR, required: false })
  @IsEnum(ExperienceLevel)
  @IsOptional()
  proficiency?: ExperienceLevel;

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @Min(0)
  @Max(50)
  @IsOptional()
  yearsOfExperience?: number;
}
