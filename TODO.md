# Test Fixes TODO

## Service Tests - Add PrismaService Provider
- [x] src/users/users.service.spec.ts
- [x] src/profile/profile.service.spec.ts
- [x] src/roles/roles.service.spec.ts
- [x] src/enterprise/enterprise.service.spec.ts
- [x] src/permission-assignment/permission-assignment.service.spec.ts
- [x] src/enterprise-permission/enterprise-permission.service.spec.ts
- [x] src/user-relationship/user-relationship.service.spec.ts
- [ ] src/audit-log/audit-log.service.spec.ts

## Controller Tests - Add Guards and PrismaService
- [ ] src/users/users.controller.spec.ts - missing AccessTokenGuard
- [ ] src/roles/roles.controller.spec.ts - missing OwnerGuard
- [ ] src/enterprise/enterprise.controller.spec.ts - missing guards
- [ ] src/enterprise-permission/enterprise-permission.controller.spec.ts - missing OwnerGuard
- [ ] src/auth/auth.controller.spec.ts - missing UsersService
- [ ] src/profile/profile.controller.spec.ts - enum issues

## Enum Issues
- [ ] Fix RelationshipType enum in user-relationship DTOs
- [ ] Fix EmploymentType enum in profile DTOs
- [ ] Fix ResourceType enum in audit-log DTOs

## Missing Guards
- [ ] Create/mock AccessTokenGuard
- [ ] Create/mock OwnerGuard
