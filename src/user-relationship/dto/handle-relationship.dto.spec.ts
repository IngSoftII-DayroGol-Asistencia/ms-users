import { validate } from 'class-validator';
import { HandleRelationshipDto, RelationshipAction } from './handle-relationship.dto';

describe('HandleRelationshipDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new HandleRelationshipDto();
    dto.relationshipId = 'clxyz1234567890';
    dto.action = RelationshipAction.ACCEPT;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with empty relationshipId', async () => {
    const dto = new HandleRelationshipDto();
    dto.relationshipId = '';
    dto.action = RelationshipAction.REJECT;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with invalid action', async () => {
    const dto = new HandleRelationshipDto();
    dto.relationshipId = 'clxyz1234567890';
    dto.action = 'INVALID' as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should fail validation with missing relationshipId', async () => {
    const dto = new HandleRelationshipDto();
    dto.action = RelationshipAction.BLOCK;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation with missing action', async () => {
    const dto = new HandleRelationshipDto();
    dto.relationshipId = 'clxyz1234567890';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });
});
