import { CreateUserDto } from "src/users/dto/createUser.dto"

export class RegisterDto extends CreateUserDto {
  email: string;
  password: string;
  phone?: string | undefined;
}
