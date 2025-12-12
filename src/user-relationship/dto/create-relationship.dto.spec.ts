import { validate } from 'class-validator';
import { CreateRelationshipDto, RelationshipType } from './create-relationship.dto';

describe('CreateRelationshipDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new CreateRelationshipDto();
    dto.relatedUserId = 'clxyz1234567890';
    dto.relationshipType = RelationshipType.FRIEND;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with empty relatedUserId', async () => {
    const dto = new CreateRelationshipDto();
    dto.relatedUserId = '';
    dto.relationshipType = RelationshipType.COLLABORATOR;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid relationshipType', async () => {
    const dto = new CreateRelationshipDto();
    dto.relatedUserId = 'clxyz1234567890';
    dto.relationshipType = 'INVALID' as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should fail validation with missing relatedUserId', async () => {
    const dto = new CreateRelationshipDto();
    dto.relationshipType = RelationshipType.TEAM_MEMBER;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing relationshipType', async () => {
    const dto = new CreateRelationshipDto();
    dto.relatedUserId = 'clxyz1234567890';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });
});
