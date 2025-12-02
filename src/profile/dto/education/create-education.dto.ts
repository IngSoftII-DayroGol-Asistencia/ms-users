import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class CreateEducationDto {
  @ApiProperty({ example: 'Universidad Nacional de Colombia' })
  @IsString()
  @IsNotEmpty()
  school: string;

  @ApiProperty({ example: 'Ingeniería de Sistemas' })
  @IsString()
  @IsNotEmpty()
  degree: string;

  @ApiProperty({ example: 'Ciencias de la Computación' })
  @IsString()
  @IsNotEmpty()
  fieldOfStudy: string;

  @ApiProperty({ example: '4. 5/5. 0', required: false })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiProperty({ example: '2015-01-15T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2020-12-15T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @ApiProperty({ example: 'Tesis sobre inteligencia artificial aplicada', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['Machine Learning', 'Bases de Datos', 'Algoritmos'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}
