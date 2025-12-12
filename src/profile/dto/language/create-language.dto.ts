import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLanguageDto {
  @ApiProperty({ example: 'Inglés' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({
    example: 'C1 - Avanzado',
    description: 'Nivel de dominio: A1, A2, B1, B2, C1, C2 o Nativo'
  })
  @IsString()
  @IsNotEmpty()
  proficiency: string;
}
