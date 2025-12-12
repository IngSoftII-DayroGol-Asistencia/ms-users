import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum JoinRequestAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class HandleJoinRequestDto {
  @ApiProperty({
    example: 'clxyz1234567890abcdef',
    description: 'ID de la solicitud de unión'
  })
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @ApiProperty({
    enum: JoinRequestAction,
    example: JoinRequestAction.APPROVE,
    description: 'Acción a realizar: APPROVE o REJECT'
  })
  @IsEnum(JoinRequestAction)
  @IsNotEmpty()
  action: JoinRequestAction;
}
