import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsStrongPassword } from "class-validator";
import { CreateUserDto } from "src/users/dto/createUser.dto";

export class RegisterDto extends CreateUserDto {

  @ApiProperty({ example: "carlos.mendozaaa@ejemplo. com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "SecurePass123!" })
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: "+573001234587", required: false })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;
}
