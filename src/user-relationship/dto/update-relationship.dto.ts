import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum RelationshipType {
  CONTACT = 'CONTACT',
  COLLABORATOR = 'COLLABORATOR',
  FRIEND = 'FRIEND',
  COLLEAGUE = 'COLLEAGUE',
  MENTOR = 'MENTOR',
  MENTEE = 'MENTEE',
  TEAM_MEMBER = 'TEAM_MEMBER',
}

export class UpdateRelationshipDto {
  @ApiProperty({
    enum: RelationshipType,
    example: RelationshipType.FRIEND,
    required: false
  })
  @IsEnum(RelationshipType)
  @IsOptional()
  relationshipType?: RelationshipType;
}
