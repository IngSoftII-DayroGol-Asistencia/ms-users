import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, ForbiddenException, HttpException } from '@nestjs/common';

describe('RolesService', () => {
  let service: RolesService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user1',
    email: 'user@example.com',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockEnterprise = {
    id: 'enterprise1',
    name: 'Test Enterprise',
  };

  const mockMembership = {
    id: 'membership1',
    userId: 'user1',
    enterpriseId: 'enterprise1',
    isOwner: true,
  };

  const mockRole = {
    id: 'role1',
    name: 'Test Role',
    description: 'Test Description',
    enterpriseId: 'enterprise1',
    isSystem: false,
    isCustom: true,
    permissions: [],
    users: [],
    _count: { users: 0 },
  };

  const mockPermission = {
    id: 'permission1',
    resource: 'users',
    action: 'read',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      userEnterprise: {
        findFirst: jest.fn(),
      },
      role: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      permission: {
        findMany: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prismaService = module.get(PrismaService) as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserEnterprise', () => {
    it('should return user enterprise membership', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);

      const result = await service['getUserEnterprise']('user1');

      expect(result).toEqual(mockMembership);
      expect(prismaService.userEnterprise.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
    });

    it('should throw ForbiddenException if user has no enterprise', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect(service['getUserEnterprise']('user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyOwnership', () => {
    it('should return membership if user is owner', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);

      const result = await service['verifyOwnership']('user1');

      expect(result).toEqual(mockMembership);
      expect(prismaService.userEnterprise.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          isOwner: true,
        },
      });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect(service['verifyOwnership']('user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyUserInSameEnterprise', () => {
    it('should return memberships if users are in same enterprise', async () => {
      const targetMembership = { ...mockMembership, userId: 'user2' };
      prismaService.userEnterprise.findFirst
        .mockResolvedValueOnce(mockMembership)
        .mockResolvedValueOnce(targetMembership);

      const result = await service['verifyUserInSameEnterprise']('user1', 'user2');

      expect(result).toEqual({
        userMembership: mockMembership,
        targetMembership,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.userEnterprise.findFirst
        .mockResolvedValueOnce(mockMembership)
        .mockResolvedValueOnce(null);

      await expect(service['verifyUserInSameEnterprise']('user1', 'user2')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if users in different enterprises', async () => {
      const targetMembership = { ...mockMembership, userId: 'user2', enterpriseId: 'enterprise2' };
      prismaService.userEnterprise.findFirst
        .mockResolvedValueOnce(mockMembership)
        .mockResolvedValueOnce(targetMembership);

      await expect(service['verifyUserInSameEnterprise']('user1', 'user2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Role',
      description: 'New Description',
      permissionIds: ['permission1'],
    };

    it('should create a role successfully', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.create.mockResolvedValue(mockRole);

      const result = await service.create(createDto, 'user1');

      expect(result).toEqual(mockRole);
      expect(prismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          description: createDto.description,
          enterpriseId: mockMembership.enterpriseId,
          isSystem: false,
          isCustom: true,
          permissions: {
            connect: [{ id: 'permission1' }],
          },
        },
        include: {
          permissions: true,
        },
      });
    });

    it('should create a role without permissions', async () => {
      const dtoWithoutPermissions = { name: 'New Role', description: 'New Description' };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.create.mockResolvedValue(mockRole);

      await service.create(dtoWithoutPermissions, 'user1');

      expect(prismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: dtoWithoutPermissions.name,
          description: dtoWithoutPermissions.description,
          enterpriseId: mockMembership.enterpriseId,
          isSystem: false,
          isCustom: true,
        },
        include: {
          permissions: true,
        },
      });
    });

    it('should throw ConflictException on duplicate name', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      const error = { code: 'P2002' };
      prismaService.role.create.mockRejectedValue(error);

      await expect(service.create(createDto, 'user1')).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all roles for user enterprise', async () => {
      const roles = [mockRole];
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findMany.mockResolvedValue(roles);

      const result = await service.findAll('user1');

      expect(result).toEqual(roles);
      expect(prismaService.role.findMany).toHaveBeenCalledWith({
        where: { enterpriseId: mockMembership.enterpriseId },
        include: {
          permissions: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a specific role', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(mockRole);

      const result = await service.findOne('role1', 'user1');

      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(null);

      await expect(service.findOne('role1', 'user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Role',
      description: 'Updated Description',
      permissionIds: ['permission1'],
    };

    it('should update a role successfully', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(mockRole);
      prismaService.role.update.mockResolvedValue(mockRole);

      const result = await service.update('role1', updateDto, 'user1');

      expect(result).toEqual(mockRole);
    });

    it('should throw ForbiddenException for system roles', async () => {
      const systemRole = { ...mockRole, isSystem: true };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(systemRole);

      await expect(service.update('role1', updateDto, 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException on duplicate name', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(mockRole);
      const error = { code: 'P2002' };
      prismaService.role.update.mockRejectedValue(error);

      await expect(service.update('role1', updateDto, 'user1')).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a role successfully', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(mockRole);
      prismaService.role.delete.mockResolvedValue(mockRole);

      const result = await service.remove('role1', 'user1');

      expect(result).toEqual({ message: 'Rol eliminado correctamente' });
    });

    it('should throw ForbiddenException for system roles', async () => {
      const systemRole = { ...mockRole, isSystem: true };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(systemRole);

      await expect(service.remove('role1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assignRoleToUser', () => {
    const assignDto = {
      userId: 'user2',
      roleId: 'role1',
    };

    it('should assign role to user successfully', async () => {
      const targetMembership = { ...mockMembership, userId: 'user2' };
      prismaService.userEnterprise.findFirst
        .mockImplementation((args) => {
          if (args.where.userId === 'user1') return Promise.resolve(mockMembership);
          if (args.where.userId === 'user2') return Promise.resolve(targetMembership);
          return Promise.resolve(null);
        });
      prismaService.role.findFirst.mockResolvedValue(mockRole);
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.update.mockResolvedValue(mockUser as any);

      const result = await service.assignRoleToUser(assignDto, 'user1');

      expect(result).toEqual({ message: `Rol ${mockRole.name} asignado correctamente` });
    });

    it('should throw ConflictException if user already has role', async () => {
      const targetMembership = { ...mockMembership, userId: 'user2' };
      prismaService.userEnterprise.findFirst
        .mockImplementation((args) => {
          if (args.where.userId === 'user1') return Promise.resolve(mockMembership);
          if (args.where.userId === 'user2') return Promise.resolve(targetMembership);
          return Promise.resolve(null);
        });
      prismaService.role.findFirst.mockResolvedValue(mockRole);
      prismaService.user.findFirst.mockResolvedValue(mockUser as any);

      await expect(service.assignRoleToUser(assignDto, 'user1')).rejects.toThrow(ConflictException);
    });
  });

  describe('removeRoleFromUser', () => {
    const assignDto = {
      userId: 'user2',
      roleId: 'role1',
    };

    it('should remove role from user successfully', async () => {
      const targetMembership = { ...mockMembership, userId: 'user2' };
      prismaService.userEnterprise.findFirst
        .mockImplementation((args) => {
          if (args.where.userId === 'user1') return Promise.resolve(mockMembership);
          if (args.where.userId === 'user2') return Promise.resolve(targetMembership);
          return Promise.resolve(null);
        });
      prismaService.user.update.mockResolvedValue(mockUser as any);

      const result = await service.removeRoleFromUser(assignDto, 'user1');

      expect(result).toEqual({ message: 'Rol removido correctamente' });
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      const targetMembership = { ...mockMembership, userId: 'user2' };
      const userWithRoles = { ...mockUser, roles: [mockRole] };
      prismaService.userEnterprise.findFirst
        .mockResolvedValueOnce(mockMembership)
        .mockResolvedValueOnce(targetMembership);
      prismaService.user.findUnique.mockResolvedValue(userWithRoles as any);

      const result = await service.getUserRoles('user2', 'user1');

      expect(result).toEqual(userWithRoles);
    });
  });

  describe('getMyRoles', () => {
    it('should return current user roles', async () => {
      const userWithRoles = { ...mockUser, roles: [mockRole] };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.user.findUnique.mockResolvedValue(userWithRoles as any);

      const result = await service.getMyRoles('user1');

      expect(result).toEqual({
        ...userWithRoles,
        isOwner: mockMembership.isOwner,
      });
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions', async () => {
      const permissions = [mockPermission];
      prismaService.permission.findMany.mockResolvedValue(permissions);

      const result = await service.getAllPermissions();

      expect(result).toEqual(permissions);
      expect(prismaService.permission.findMany).toHaveBeenCalledWith({
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' },
        ],
      });
    });
  });

  describe('addPermissionToRole', () => {
    it('should add permission to role successfully', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(mockRole);
      prismaService.role.update.mockResolvedValue(mockRole);

      const result = await service.addPermissionToRole('role1', 'permission1', 'user1');

      expect(result).toEqual({ message: 'Permiso agregado al rol' });
    });

    it('should throw ForbiddenException for system roles', async () => {
      const systemRole = { ...mockRole, isSystem: true };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(systemRole);

      await expect(service.addPermissionToRole('role1', 'permission1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removePermissionFromRole', () => {
    it('should remove permission from role successfully', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(mockRole);
      prismaService.role.update.mockResolvedValue(mockRole);

      const result = await service.removePermissionFromRole('role1', 'permission1', 'user1');

      expect(result).toEqual({ message: 'Permiso removido del rol' });
    });

    it('should throw ForbiddenException for system roles', async () => {
      const systemRole = { ...mockRole, isSystem: true };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.role.findFirst.mockResolvedValue(systemRole);

      await expect(service.removePermissionFromRole('role1', 'permission1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });
});
