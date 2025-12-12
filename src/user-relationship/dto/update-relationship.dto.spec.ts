import { validate } from 'class-validator';
import { UpdateRelationshipDto, RelationshipType } from './update-relationship.dto';

describe('UpdateRelationshipDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new UpdateRelationshipDto();
    dto.relationshipType = RelationshipType.FRIEND;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with no data (optional field)', async () => {
    const dto = new UpdateRelationshipDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid relationshipType', async () => {
    const dto = new UpdateRelationshipDto();
    dto.relationshipType = 'INVALID' as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });
});
