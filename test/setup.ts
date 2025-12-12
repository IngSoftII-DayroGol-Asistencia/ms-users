const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $on: jest.fn(),
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userProfile: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  enterprise: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  permission: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  permissionAssignment: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  enterprisePermission: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userRelationship: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => 'hashedPassword'),
  compare: jest.fn(() => true),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
  TokenType: {
    ACCESS: 'ACCESS',
    REFRESH: 'REFRESH',
    PASSWORD_RESET: 'PASSWORD_RESET',
    EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  },
  EmploymentType: {
    FULL_TIME: 'FULL_TIME',
    PART_TIME: 'PART_TIME',
    CONTRACT: 'CONTRACT',
    FREELANCE: 'FREELANCE',
    INTERN: 'INTERN',
  },
  ExperienceLevel: {
    JUNIOR: 'JUNIOR',
    MID: 'MID',
    SENIOR: 'SENIOR',
    LEAD: 'LEAD',
    PRINCIPAL: 'PRINCIPAL',
  },
  ResourceType: {
    USERS: 'USERS',
    ROLES: 'ROLES',
    PERMISSIONS: 'PERMISSIONS',
    AUDIT_LOGS: 'AUDIT_LOGS',
    SETTINGS: 'SETTINGS',
    ENTERPRISE: 'ENTERPRISE',
    USER_RELATIONSHIPS: 'USER_RELATIONSHIPS',
  },
  RelationshipType: {
    CONTACT: 'CONTACT',
    COLLABORATOR: 'COLLABORATOR',
    FRIEND: 'FRIEND',
    COLLEAGUE: 'COLLEAGUE',
    MENTOR: 'MENTOR',
    MENTEE: 'MENTEE',
    TEAM_MEMBER: 'TEAM_MEMBER',
  },
  JoinRequestStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  PermissionAction: {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    MANAGE: 'MANAGE',
  },
  Prisma: {
    JsonNull: null,
  },
}));
