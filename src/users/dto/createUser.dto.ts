import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserDto {

  @ApiProperty({ example: "Carlos" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Mendoza García" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: "1995-03-15T00:00:00.000Z", required: false, nullable: true })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: "Senior Software Developer", required: false, nullable: true })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({ example: "Engineering", required: false, nullable: true })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({
    example: "Desarrollador full-stack con 5 años de experiencia en NestJS y React. Apasionado por la arquitectura de software y las buenas prácticas.",
    required: false,
    nullable: true
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({
    example: "https://images. unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    required: false,
    nullable: true
  })
  @IsString()
  @IsOptional()
  profilePhotoUrl?: string;

  @ApiProperty({ example: "profiles/carlos-mendoza-2024. jpg", required: false, nullable: true })
  @IsString()
  @IsOptional()
  profilePhotoKey?: string;

  @ApiProperty({ example: "María García López", required: false, nullable: true })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiProperty({ example: "+573115551214", required: false, nullable: true })
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiProperty({ example: "Colombia", required: false, nullable: true })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: "Bogotá", required: false, nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: "Calle 100 #15-20, Apartamento 501", required: false, nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: "110111", required: false, nullable: true })
  @IsString()
  @IsOptional()
  postalCode?: string;
}
