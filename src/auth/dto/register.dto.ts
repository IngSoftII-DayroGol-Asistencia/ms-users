import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsStrongPassword } from "class-validator";
import { CreateUserDto } from "src/users/dto/createUser.dto"

export class RegisterDto extends CreateUserDto {

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;
}
