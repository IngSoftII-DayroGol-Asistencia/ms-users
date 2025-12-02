import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateCertificationDto {
  @ApiProperty({ example: 'AWS Solutions Architect Professional' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Amazon Web Services' })
  @IsString()
  @IsNotEmpty()
  issuingOrganization: string;

  @ApiProperty({ example: '2023-03-15T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @ApiProperty({ example: '2026-03-15T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({ example: 'https://aws.amazon.com/verification/123456', required: false })
  @IsUrl()
  @IsOptional()
  certificateUrl?: string;

  @ApiProperty({ example: 'AWS-SAP-123456', required: false })
  @IsString()
  @IsOptional()
  certificateId?: string;

  @ApiProperty({ example: 'Certificación avanzada en arquitectura cloud', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
