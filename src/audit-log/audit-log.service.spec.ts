import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService, AuditActions } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto';
import { ResourceType, Prisma } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      groupBy: jest.fn(),
    },
    userEnterprise: {
      findFirst: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyOwnership', () => {
    it('should return membership when user is owner', async () => {
      const userId = 'user-123';
      const mockMembership = { userId, enterpriseId: 'ent-123', isOwner: true };

      mockPrismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);

      const result = await (service as any).verifyOwnership(userId);

      expect(mockPrismaService.userEnterprise.findFirst).toHaveBeenCalledWith({
        where: { userId, isOwner: true },
      });
      expect(result).toEqual(mockMembership);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const userId = 'user-123';

      mockPrismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect((service as any).verifyOwnership(userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getEnterpriseByUserId', () => {
    it('should return enterpriseId when user has membership', async () => {
      const userId = 'user-123';
      const enterpriseId = 'ent-123';

      mockPrismaService.userEnterprise.findFirst.mockResolvedValue({
        userId,
        enterpriseId,
      });

      const result = await (service as any).getEnterpriseByUserId(userId);

      expect(result).toEqual(enterpriseId);
    });

    it('should return null when user has no membership', async () => {
      const userId = 'user-123';

      mockPrismaService.userEnterprise.findFirst.mockResolvedValue(null);

      const result = await (service as any).getEnterpriseByUserId(userId);

      expect(result).toBeNull();
    });
  });

  describe('createLog', () => {
    it('should create audit log successfully', async () => {
      const userId = 'user-123';
      const dto: CreateAuditLogDto = {
        action: AuditActions.CREATE,
        resource: ResourceType.USERS,
        resourceId: 'res-123',
        changes: { name: 'test' },
      };
      const request = { ip: '127.0.0.1', headers: { 'user-agent': 'test-agent' } };
      const mockLog = {
        id: 'log-123',
        userId,
        enterpriseId: 'ent-123',
        ...dto,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        createdAt: new Date(),
      };

      (service as any).getEnterpriseByUserId = jest.fn().mockResolvedValue('ent-123');
      mockPrismaService.auditLog.create.mockResolvedValue(mockLog);

      const result = await service.createLog(userId, dto, request);

      expect((service as any).getEnterpriseByUserId).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          enterpriseId: 'ent-123',
          action: dto.action,
          resource: dto.resource,
          resourceId: dto.resourceId,
          changes: dto.changes,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      });
      expect(result).toEqual(mockLog);
    });

    it('should create log without request data', async () => {
      const userId = 'user-123';
      const dto: CreateAuditLogDto = {
        action: AuditActions.UPDATE,
        resource: ResourceType.USERS,
      };

      (service as any).getEnterpriseByUserId = jest.fn().mockResolvedValue(null);
      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'log-123',
        userId,
        enterpriseId: null,
        ...dto,
        ipAddress: null,
        userAgent: null,
      });

      const result = await service.createLog(userId, dto);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          enterpriseId: null,
          action: dto.action,
          resource: dto.resource,
          resourceId: dto.resourceId,
          changes: dto.changes ?? Prisma.JsonNull,
          ipAddress: null,
          userAgent: null,
        },
      });
      expect(result).toBeDefined();
    });
  });

  describe('log', () => {
    it('should call createLog with correct parameters', async () => {
      const userId = 'user-123';
      const action = AuditActions.LOGIN;
      const resource = ResourceType.USERS;
      const resourceId = 'res-123';
      const changes = { status: 'active' };
      const request = { ip: '127.0.0.1' };

      const mockResult = { id: 'log-123' };
      service.createLog = jest.fn().mockResolvedValue(mockResult);

      const result = await service.log(userId, action, resource, resourceId, changes, request);

      expect(service.createLog).toHaveBeenCalledWith(
        userId,
        { action, resource, resourceId, changes },
        request,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getEnterpriseLogs', () => {
    it('should return enterprise logs with pagination', async () => {
      const userId = 'user-123';
      const query = { page: 1, limit: 10, resource: ResourceType.USERS };
      const mockMembership = { enterpriseId: 'ent-123' };
      const mockLogs = [
        {
          id: 'log-1',
          action: 'CREATE',
          resource: 'USERS',
          resourceId: 'user-456',
          changes: null,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          user: {
            id: 'user-456',
            email: 'user@example.com',
            profile: { firstName: 'John', lastName: 'Doe' },
          },
        },
      ];

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      const result = await service.getEnterpriseLogs(userId, query);

      expect((service as any).verifyOwnership).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          enterpriseId: 'ent-123',
          resource: ResourceType.USERS,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].user.fullName).toBe('John Doe');
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should apply date filters', async () => {
      const userId = 'user-123';
      const query = {
        page: 1,
        limit: 10,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };
      const mockMembership = { enterpriseId: 'ent-123' };

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.getEnterpriseLogs(userId, query);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2023-01-01'),
              lte: new Date('2023-12-31'),
            },
          }),
        }),
      );
    });

    it('should apply user filter', async () => {
      const userId = 'user-123';
      const query = { page: 1, limit: 10, userId: 'filter-user-456' };
      const mockMembership = { enterpriseId: 'ent-123' };

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.getEnterpriseLogs(userId, query);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'filter-user-456',
          }),
        }),
      );
    });

    it('should apply action filter', async () => {
      const userId = 'user-123';
      const query = { page: 1, limit: 10, action: 'CREATE' };
      const mockMembership = { enterpriseId: 'ent-123' };

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.getEnterpriseLogs(userId, query);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'CREATE',
          }),
        }),
      );
    });
  });

  describe('getMyLogs', () => {
    it('should return user logs with pagination', async () => {
      const userId = 'user-123';
      const query = { page: 1, limit: 5 };
      const mockLogs = [
        {
          id: 'log-1',
          action: 'LOGIN',
          resource: 'USERS',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      const result = await service.getMyLogs(userId, query);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 5,
      });
      expect(result.data).toEqual(mockLogs);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should handle pagination correctly', async () => {
      const userId = 'user-123';
      const query = { page: 2, limit: 10 };
      const mockLogs = [];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(25);

      const result = await service.getMyLogs(userId, query);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });

  describe('getLogById', () => {
    it('should return log when user has access', async () => {
      const logId = 'log-123';
      const userId = 'user-123';
      const mockMembership = { enterpriseId: 'ent-123' };
      const mockLog = {
        id: logId,
        enterpriseId: 'ent-123',
        action: 'CREATE',
        user: {
          id: 'user-456',
          email: 'user@example.com',
          profile: { firstName: 'John', lastName: 'Doe', profilePhotoUrl: 'photo.jpg' },
        },
      };

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.findUnique.mockResolvedValue(mockLog);

      const result = await service.getLogById(logId, userId);

      expect(mockPrismaService.auditLog.findUnique).toHaveBeenCalledWith({
        where: { id: logId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePhotoUrl: true,
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockLog);
    });

    it('should throw NotFoundException when log not found', async () => {
      const logId = 'log-123';
      const userId = 'user-123';
      const mockMembership = { enterpriseId: 'ent-123' };

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.findUnique.mockResolvedValue(null);

      await expect(service.getLogById(logId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user has no access to log', async () => {
      const logId = 'log-123';
      const userId = 'user-123';
      const mockMembership = { enterpriseId: 'ent-123' };
      const mockLog = {
        id: logId,
        enterpriseId: 'different-ent',
        action: 'CREATE',
      };

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.findUnique.mockResolvedValue(mockLog);

      await expect(service.getLogById(logId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAuditStats', () => {
    it('should return audit statistics', async () => {
      const userId = 'user-123';
      const days = 30;
      const mockMembership = { enterpriseId: 'ent-123' };
      const mockLogsByAction = [{ action: 'CREATE', _count: 10 }];
      const mockLogsByResource = [{ resource: 'USERS', _count: 15 }];
      const mockLogsByUser = [{ userId: 'user-456', _count: 5 }];
      const mockUsers = [
        {
          id: 'user-456',
          email: 'user@example.com',
          profile: { firstName: 'John', lastName: 'Doe' },
        },
      ];

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.count.mockResolvedValue(25);
      mockPrismaService.auditLog.groupBy
        .mockResolvedValueOnce(mockLogsByAction)
        .mockResolvedValueOnce(mockLogsByResource)
        .mockResolvedValueOnce(mockLogsByUser);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAuditStats(userId, days);

      expect(result.totalLogs).toBe(25);
      expect(result.byAction).toHaveLength(1);
      expect(result.byAction[0]).toEqual({ action: 'CREATE', count: 10 });
      expect(result.byResource).toHaveLength(1);
      expect(result.byResource[0]).toEqual({ resource: 'USERS', count: 15 });
      expect(result.topUsers).toHaveLength(1);
      expect(result.topUsers[0].fullName).toBe('John Doe');
      expect(result.period).toBe('Últimos 30 días');
    });

    it('should use default days when not provided', async () => {
      const userId = 'user-123';
      const mockMembership = { enterpriseId: 'ent-123' };

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.count.mockResolvedValue(0);
      mockPrismaService.auditLog.groupBy.mockResolvedValue([]);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getAuditStats(userId);

      expect(result.period).toBe('Últimos 30 días');
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete old logs and return result', async () => {
      const daysToKeep = 90;
      const mockDeleteResult = { count: 150 };

      mockPrismaService.auditLog.deleteMany.mockResolvedValue(mockDeleteResult);

      const result = await service.cleanupOldLogs(daysToKeep);

      expect(mockPrismaService.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
        },
      });
      expect(result.deletedCount).toBe(150);
      expect(result.message).toBe('150 logs eliminados');
      expect(result.cutoffDate).toBeDefined();
    });

    it('should use default days when not provided', async () => {
      const mockDeleteResult = { count: 0 };

      mockPrismaService.auditLog.deleteMany.mockResolvedValue(mockDeleteResult);

      const result = await service.cleanupOldLogs();

      expect(result.deletedCount).toBe(0);
      expect(result.message).toBe('0 logs eliminados');
    });
  });

  describe('exportLogs', () => {
    it('should return formatted export data', async () => {
      const userId = 'user-123';
      const query = { resource: ResourceType.USERS };
      const mockMembership = { enterpriseId: 'ent-123' };
      const mockLogs = [
        {
          id: 'log-1',
          createdAt: new Date('2023-01-01T10:00:00Z'),
          action: 'CREATE',
          resource: 'USERS',
          resourceId: 'user-456',
          ipAddress: '127.0.0.1',
          changes: { name: 'test' },
          user: {
            email: 'user@example.com',
            profile: { firstName: 'John', lastName: 'Doe' },
          },
        },
      ];

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.exportLogs(userId, query);

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'log-1',
        fecha: '2023-01-01T10:00:00.000Z',
        usuario: 'user@example.com',
        nombre: 'John Doe',
        accion: 'CREATE',
        recurso: 'USERS',
        recursoId: 'user-456',
        ip: '127.0.0.1',
        cambios: '{"name":"test"}',
      });
    });

    it('should handle logs without profile data', async () => {
      const userId = 'user-123';
      const query = {};
      const mockMembership = { enterpriseId: 'ent-123' };
      const mockLogs = [
        {
          id: 'log-1',
          createdAt: new Date(),
          action: 'LOGIN',
          resource: 'USERS',
          resourceId: null,
          ipAddress: null,
          changes: null,
          user: {
            email: 'user@example.com',
            profile: null,
          },
        },
      ];

      (service as any).verifyOwnership = jest.fn().mockResolvedValue(mockMembership);
      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.exportLogs(userId, query);

      expect(result.data[0].nombre).toBe('');
      expect(result.data[0].ip).toBe('');
      expect(result.data[0].cambios).toBe('');
    });
  });
});
