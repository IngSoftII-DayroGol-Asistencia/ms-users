import { Test, TestingModule } from '@nestjs/testing';
import { EnterprisePermissionService } from './enterprise-permission.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PermissionAction, ResourceType } from '@prisma/client';

describe('EnterprisePermissionService', () => {
  let service: EnterprisePermissionService;
  let prismaService: any;

  beforeEach(async () => {
    const mockPrismaService = {
      userEnterprise: {
        findFirst: jest.fn(),
      },
      permission: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        createMany: jest.fn(),
      },
      enterprisePermission: {
        findUnique: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterprisePermissionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EnterprisePermissionService>(EnterprisePermissionService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyOwnership', () => {
    it('should return membership if user is owner', async () => {
      const mockMembership = { userId: 'user1', enterpriseId: 'ent1', isOwner: true };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);

      const result = await (service as any).verifyOwnership('user1');
      expect(result).toEqual(mockMembership);
      expect(prismaService.userEnterprise.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user1', isOwner: true },
      });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect((service as any).verifyOwnership('user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getEnterpriseByUserId', () => {
    it('should return membership if user belongs to enterprise', async () => {
      const mockMembership = { userId: 'user1', enterpriseId: 'ent1' };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);

      const result = await (service as any).getEnterpriseByUserId('user1');
      expect(result).toEqual(mockMembership);
    });

    it('should throw NotFoundException if user does not belong to any enterprise', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect((service as any).getEnterpriseByUserId('user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignPermissionToEnterprise', () => {
    const dto = { permissionId: 'perm1', expiresAt: '2025-12-31T23:59:59.000Z' };

    it('should assign permission successfully', async () => {
      const mockMembership = { userId: 'user1', enterpriseId: 'ent1', isOwner: true };
      const mockPermission = { id: 'perm1', name: 'READ_USER' };
      const mockEnterprisePermission = { id: 'ep1', enterpriseId: 'ent1', permissionId: 'perm1' };

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      prismaService.permission.findUnique.mockResolvedValue(mockPermission);
      prismaService.enterprisePermission.findUnique.mockResolvedValue(null);
      prismaService.enterprisePermission.create.mockResolvedValue(mockEnterprisePermission);

      const result = await service.assignPermissionToEnterprise('user1', dto);
      expect(result.message).toContain('asignado');
      expect(prismaService.enterprisePermission.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if permission does not exist', async () => {
      (service as any).verifyOwnership = jest.fn().mockResolvedValue({ enterpriseId: 'ent1' });
      prismaService.permission.findUnique.mockResolvedValue(null);

      await expect(service.assignPermissionToEnterprise('user1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if permission already assigned', async () => {
      (service as any).verifyOwnership = jest.fn().mockResolvedValue({ enterpriseId: 'ent1' });
      prismaService.permission.findUnique.mockResolvedValue({ id: 'perm1' });
      prismaService.enterprisePermission.findUnique.mockResolvedValue({ id: 'ep1' });

      await expect(service.assignPermissionToEnterprise('user1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('bulkAssignPermissions', () => {
    const dto = { permissionIds: ['perm1', 'perm2'], expiresAt: '2025-12-31T23:59:59.000Z' };

    it('should assign permissions successfully', async () => {
      const mockMembership = { enterpriseId: 'ent1' };
      const mockPermissions = [{ id: 'perm1' }, { id: 'perm2' }];

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      prismaService.permission.findMany.mockResolvedValue(mockPermissions);
      prismaService.enterprisePermission.findMany.mockResolvedValue([]);
      prismaService.enterprisePermission.createMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkAssignPermissions('user1', dto);
      expect(result.assigned).toBe(2);
      expect(result.skipped).toBe(0);
    });

    it('should throw NotFoundException if some permissions do not exist', async () => {
      (service as any).verifyOwnership = jest.fn().mockResolvedValue({ enterpriseId: 'ent1' });
      prismaService.permission.findMany.mockResolvedValue([{ id: 'perm1' }]); // Only one found

      await expect(service.bulkAssignPermissions('user1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if all permissions already assigned', async () => {
      (service as any).verifyOwnership = jest.fn().mockResolvedValue({ enterpriseId: 'ent1' });
      prismaService.permission.findMany.mockResolvedValue([{ id: 'perm1' }, { id: 'perm2' }]);
      prismaService.enterprisePermission.findMany.mockResolvedValue([{ permissionId: 'perm1' }, { permissionId: 'perm2' }]);

      await expect(service.bulkAssignPermissions('user1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('revokePermission', () => {
    it('should revoke permission successfully', async () => {
      const mockMembership = { enterpriseId: 'ent1' };
      const mockEnterprisePermission = { id: 'ep1', enterpriseId: 'ent1', permission: { name: 'READ_USER' } };

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      prismaService.enterprisePermission.findUnique.mockResolvedValue(mockEnterprisePermission);

      const result = await service.revokePermission('ep1', 'user1');
      expect(result.message).toContain('revocado');
      expect(prismaService.enterprisePermission.delete).toHaveBeenCalledWith({ where: { id: 'ep1' } });
    });

    it('should throw NotFoundException if enterprise permission does not exist', async () => {
      (service as any).verifyOwnership = jest.fn().mockResolvedValue({ enterpriseId: 'ent1' });
      prismaService.enterprisePermission.findUnique.mockResolvedValue(null);

      await expect(service.revokePermission('ep1', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if permission belongs to different enterprise', async () => {
      (service as any).verifyOwnership = jest.fn().mockResolvedValue({ enterpriseId: 'ent1' });
      prismaService.enterprisePermission.findUnique.mockResolvedValue({ enterpriseId: 'ent2' });

      await expect(service.revokePermission('ep1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getEnterprisePermissions', () => {
    it('should return grouped permissions', async () => {
      const mockMembership = { enterpriseId: 'ent1' };
      const mockPermissions = [
        { id: 'ep1', permission: { resource: ResourceType.USER, action: PermissionAction.READ, name: 'READ_USER' }, grantedAt: new Date(), expiresAt: null, grantedByUser: { id: 'user1', email: 'test@example.com', profile: { firstName: 'John', lastName: 'Doe' } } },
      ];

      (service as any).getEnterpriseByUserId = jest.fn().mockResolvedValue(mockMembership);
      prismaService.enterprisePermission.findMany.mockResolvedValue(mockPermissions);

      const result = await service.getEnterprisePermissions('user1');
      expect(result.total).toBe(1);
      expect(result.permissions[ResourceType.USER]).toBeDefined();
    });
  });

  describe('getAvailablePermissions', () => {
    it('should return available and assigned permissions', async () => {
      const mockMembership = { enterpriseId: 'ent1' };
      const mockAllPermissions = [
        { id: 'perm1', resource: ResourceType.USER, action: PermissionAction.READ, name: 'READ_USER' },
        { id: 'perm2', resource: ResourceType.USER, action: PermissionAction.WRITE, name: 'WRITE_USER' },
      ];
      const mockAssigned = [{ permissionId: 'perm1' }];

      (service as any).getEnterpriseByUserId = jest.fn().mockResolvedValue(mockMembership);
      prismaService.permission.findMany.mockResolvedValue(mockAllPermissions);
      prismaService.enterprisePermission.findMany.mockResolvedValue(mockAssigned);

      const result = await service.getAvailablePermissions('user1');
      expect(result.available.total).toBe(1);
      expect(result.assigned.total).toBe(1);
    });
  });

  describe('checkEnterprisePermission', () => {
    it('should return true if user has permission', async () => {
      const mockMembership = { userId: 'user1', enterpriseId: 'ent1', isOwner: false };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.enterprisePermission.findFirst.mockResolvedValue({ id: 'ep1' });

      const result = await service.checkEnterprisePermission('user1', PermissionAction.READ, ResourceType.USER);
      expect(result).toBe(true);
    });

    it('should return true if user is owner', async () => {
      const mockMembership = { userId: 'user1', enterpriseId: 'ent1', isOwner: true };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);

      const result = await service.checkEnterprisePermission('user1', PermissionAction.READ, ResourceType.USER);
      expect(result).toBe(true);
    });

    it('should return false if user does not belong to enterprise', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      const result = await service.checkEnterprisePermission('user1', PermissionAction.READ, ResourceType.USER);
      expect(result).toBe(false);
    });

    it('should return false if permission not found', async () => {
      const mockMembership = { userId: 'user1', enterpriseId: 'ent1', isOwner: false };
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.enterprisePermission.findFirst.mockResolvedValue(null);

      const result = await service.checkEnterprisePermission('user1', PermissionAction.READ, ResourceType.USER);
      expect(result).toBe(false);
    });
  });

  describe('getPermissionsByResource', () => {
    it('should return permissions for resource', async () => {
      const mockMembership = { enterpriseId: 'ent1' };
      const mockPermissions = [
        { id: 'ep1', permission: { action: PermissionAction.READ, name: 'READ_USER', description: 'Read users' }, expiresAt: null },
      ];

      (service as any).getEnterpriseByUserId = jest.fn().mockResolvedValue(mockMembership);
      prismaService.enterprisePermission.findMany.mockResolvedValue(mockPermissions);

      const result = await service.getPermissionsByResource('user1', ResourceType.USER);
      expect(result).toHaveLength(1);
      expect(result[0].action).toBe(PermissionAction.READ);
    });
  });

  describe('updatePermissionExpiration', () => {
    it('should update expiration successfully', async () => {
      const mockMembership = { enterpriseId: 'ent1' };
      const mockEnterprisePermission = { id: 'ep1', enterpriseId: 'ent1', permission: { name: 'READ_USER' } };
      const mockUpdated = { id: 'ep1', expiresAt: new Date('2025-12-31') };

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      prismaService.enterprisePermission.findUnique.mockResolvedValue(mockEnterprisePermission);
      prismaService.enterprisePermission.update.mockResolvedValue(mockUpdated);

      const result = await service.updatePermissionExpiration('ep1', 'user1', '2025-12-31T23:59:59.000Z');
      expect(result.message).toContain('actualizada');
    });

    it('should throw NotFoundException if enterprise permission does not exist', async () => {
      (service as any).verifyOwnership = jest.fn().mockResolvedValue({ enterpriseId: 'ent1' });
      prismaService.enterprisePermission.findUnique.mockResolvedValue(null);

      await expect(service.updatePermissionExpiration('ep1', 'user1', '2025-12-31T23:59:59.000Z')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if permission belongs to different enterprise', async () => {
      (service as any).verifyOwnership = jest.fn().mockResolvedValue({ enterpriseId: 'ent1' });
      prismaService.enterprisePermission.findUnique.mockResolvedValue({ enterpriseId: 'ent2' });

      await expect(service.updatePermissionExpiration('ep1', 'user1', '2025-12-31T23:59:59.000Z')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('seedDefaultPermissions', () => {
    it('should seed permissions if none exist', async () => {
      prismaService.permission.count.mockResolvedValue(0);
      prismaService.permission.createMany.mockResolvedValue({ count: 12 }); // Assuming 3 actions * 4 resources

      const result = await service.seedDefaultPermissions();
      expect(result.count).toBe(12);
      expect(prismaService.permission.createMany).toHaveBeenCalled();
    });

    it('should return existing count if permissions already exist', async () => {
      prismaService.permission.count.mockResolvedValue(10);

      const result = await service.seedDefaultPermissions();
      expect(result.count).toBe(10);
      expect(prismaService.permission.createMany).not.toHaveBeenCalled();
    });
  });
});
