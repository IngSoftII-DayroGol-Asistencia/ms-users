import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum RelationshipAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  BLOCK = 'BLOCK',
}

export class HandleRelationshipDto {
  @ApiProperty({
    example: 'clxyz1234567890',
    description: 'ID de la solicitud de relación'
  })
  @IsString()
  @IsNotEmpty()
  relationshipId: string;

  @ApiProperty({
    enum: RelationshipAction,
    example: RelationshipAction.ACCEPT,
    description: 'Acción: ACCEPT, REJECT o BLOCK'
  })
  @IsEnum(RelationshipAction)
  @IsNotEmpty()
  action: RelationshipAction;
}
