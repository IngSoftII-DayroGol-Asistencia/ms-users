import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum RelationshipType {
  CONTACT = 'CONTACT',
  COLLABORATOR = 'COLLABORATOR',
  FRIEND = 'FRIEND',
  COLLEAGUE = 'COLLEAGUE',
  MENTOR = 'MENTOR',
  MENTEE = 'MENTEE',
  TEAM_MEMBER = 'TEAM_MEMBER',
}

export class CreateRelationshipDto {
  @ApiProperty({
    example: 'clxyz1234567890',
    description: 'ID del usuario con quien deseas crear la relación'
  })
  @IsString()
  @IsNotEmpty()
  relatedUserId: string;

  @ApiProperty({
    enum: RelationshipType,
    example: RelationshipType.CONTACT,
    description: 'Tipo de relación: CONTACT, COLLABORATOR, FRIEND, COLLEAGUE, MENTOR, MENTEE, TEAM_MEMBER'
  })
  @IsEnum(RelationshipType)
  @IsNotEmpty()
  relationshipType: RelationshipType;
}
