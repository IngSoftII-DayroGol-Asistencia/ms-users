import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserDto {

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  profilePhotoUrl?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  profilePhotoKey?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  postalCode?: string;
}
