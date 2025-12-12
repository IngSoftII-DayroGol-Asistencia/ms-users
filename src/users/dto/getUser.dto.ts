import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class GetUserDto {
  @ApiProperty({ example: "123", required: false })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: "carlos.mendoza@example.com", required: false })
  @IsString()
  @IsOptional()
  email?: string;
}
