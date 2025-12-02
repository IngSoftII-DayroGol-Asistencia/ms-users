import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RelationshipType } from '@prisma/client';

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
