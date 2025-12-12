import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto';
import { ResourceType, Prisma } from '@prisma/client';

// Acciones comunes del sistema
export const AuditActions = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  TOKEN_REFRESH: 'TOKEN_REFRESH',

  // CRUD
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',

  // Enterprise
  ENTERPRISE_CREATE: 'ENTERPRISE_CREATE',
  ENTERPRISE_JOIN: 'ENTERPRISE_JOIN',
  ENTERPRISE_LEAVE: 'ENTERPRISE_LEAVE',
  ENTERPRISE_JOIN_REQUEST: 'ENTERPRISE_JOIN_REQUEST',
  ENTERPRISE_JOIN_APPROVE: 'ENTERPRISE_JOIN_APPROVE',
  ENTERPRISE_JOIN_REJECT: 'ENTERPRISE_JOIN_REJECT',

  // Roles & Permissions
  ROLE_ASSIGN: 'ROLE_ASSIGN',
  ROLE_REMOVE: 'ROLE_REMOVE',
  PERMISSION_GRANT: 'PERMISSION_GRANT',
  PERMISSION_REVOKE: 'PERMISSION_REVOKE',

  // Relationships
  RELATIONSHIP_REQUEST: 'RELATIONSHIP_REQUEST',
  RELATIONSHIP_ACCEPT: 'RELATIONSHIP_ACCEPT',
  RELATIONSHIP_REJECT: 'RELATIONSHIP_REJECT',
  RELATIONSHIP_BLOCK: 'RELATIONSHIP_BLOCK',

  // Profile
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  PROFILE_PHOTO_UPDATE: 'PROFILE_PHOTO_UPDATE',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) { }

  // ==================== HELPERS ====================

  private async verifyOwnership(userId: string) {
    const membership = await this.prisma.userEnterprise.findFirst({
      where: {
        userId,
        isOwner: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Solo el propietario puede ver los logs de auditoría');
    }

    return membership;
  }

  private async getEnterpriseByUserId(userId: string) {
    const membership = await this.prisma.userEnterprise.findFirst({
      where: { userId },
    });

    return membership?.enterpriseId || null;
  }

  // ==================== CREATE LOG ====================

  async createLog(
    userId: string,
    dto: CreateAuditLogDto,
    request?: { ip?: string; headers?: Record<string, any> },
  ) {
    const enterpriseId = await this.getEnterpriseByUserId(userId);

    const auditLog = await this.prisma.auditLog.create({
      data: {
        userId,
        enterpriseId,
        action: dto.action,
        resource: dto.resource,
        resourceId: dto.resourceId,
        changes: dto.changes ?? Prisma.JsonNull,
        ipAddress: request?.ip || null,
        userAgent: request?.headers?.['user-agent'] || null,
      },
    });

    this.logger.debug(
      `Audit log created: ${dto.action} on ${dto.resource} by user ${userId}`,
    );

    return auditLog;
  }

  // ==================== HELPER METHOD FOR EASY LOGGING ====================

  async log(
    userId: string,
    action: string,
    resource: ResourceType,
    resourceId?: string,
    changes?: Record<string, any>,
    request?: { ip?: string; headers?: Record<string, any> },
  ) {
    return this.createLog(
      userId,
      { action, resource, resourceId, changes },
      request,
    );
  }

  // ==================== GET LOGS ====================

  async getEnterpriseLogs(userId: string, query: QueryAuditLogDto) {
    const membership = await this.verifyOwnership(userId);

    const { page = 1, limit = 20, userId: filterUserId, resource, action, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      enterpriseId: membership.enterpriseId,
    };

    if (filterUserId) {
      where.userId = filterUserId;
    }

    if (resource) {
      where.resource = resource;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
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
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        changes: log.changes,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        user: {
          id: log.user.id,
          email: log.user.email,
          fullName: log.user.profile
            ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
            : null,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getMyLogs(userId: string, query: QueryAuditLogDto) {
    const { page = 1, limit = 20, resource, action, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      userId,
    };

    if (resource) {
      where.resource = resource;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getLogById(logId: string, userId: string) {
    const membership = await this.verifyOwnership(userId);

    const log = await this.prisma.auditLog.findUnique({
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

    if (!log) {
      throw new NotFoundException('Log no encontrado');
    }

    if (log.enterpriseId !== membership.enterpriseId) {
      throw new ForbiddenException('No tienes acceso a este log');
    }

    return log;
  }

  // ==================== STATS ====================

  async getAuditStats(userId: string, days: number = 30) {
    const membership = await this.verifyOwnership(userId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalLogs,
      logsByAction,
      logsByResource,
      logsByUser,
    ] = await Promise.all([
      // Total de logs
      this.prisma.auditLog.count({
        where: {
          enterpriseId: membership.enterpriseId,
          createdAt: { gte: startDate },
        },
      }),
      // Logs por acción
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          enterpriseId: membership.enterpriseId,
          createdAt: { gte: startDate },
        },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      // Logs por recurso
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where: {
          enterpriseId: membership.enterpriseId,
          createdAt: { gte: startDate },
        },
        _count: true,
        orderBy: { _count: { resource: 'desc' } },
      }),
      // Logs por usuario
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          enterpriseId: membership.enterpriseId,
          createdAt: { gte: startDate },
        },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    // Obtener nombres de usuarios para el top
    const userIds = logsByUser.map((u) => u.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
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
    });

    const usersMap = new Map(users.map((u) => [u.id, u]));

    return {
      period: `Últimos ${days} días`,
      totalLogs,
      byAction: logsByAction.map((a) => ({
        action: a.action,
        count: a._count,
      })),
      byResource: logsByResource.map((r) => ({
        resource: r.resource,
        count: r._count,
      })),
      topUsers: logsByUser.map((u) => {
        const user = usersMap.get(u.userId);
        return {
          userId: u.userId,
          email: user?.email,
          fullName: user?.profile
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : null,
          count: u._count,
        };
      }),
    };
  }

  // ==================== CLEANUP OLD LOGS ====================

  async cleanupOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} audit logs older than ${daysToKeep} days`);

    return {
      message: `${result.count} logs eliminados`,
      deletedCount: result.count,
      cutoffDate,
    };
  }

  // ==================== EXPORT LOGS ====================

  async exportLogs(userId: string, query: QueryAuditLogDto) {
    const membership = await this.verifyOwnership(userId);

    const { userId: filterUserId, resource, action, startDate, endDate } = query;

    const where: Prisma.AuditLogWhereInput = {
      enterpriseId: membership.enterpriseId,
    };

    if (filterUserId) {
      where.userId = filterUserId;
    }

    if (resource) {
      where.resource = resource;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
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
      take: 10000, // Límite de exportación
    });

    // Formatear para CSV
    const csvData = logs.map((log) => ({
      id: log.id,
      fecha: log.createdAt.toISOString(),
      usuario: log.user.email,
      nombre: log.user.profile
        ? `${log.user.profile.firstName} ${log.user.profile.lastName}`
        : '',
      accion: log.action,
      recurso: log.resource,
      recursoId: log.resourceId || '',
      ip: log.ipAddress || '',
      cambios: log.changes ? JSON.stringify(log.changes) : '',
    }));

    return {
      total: csvData.length,
      data: csvData,
    };
  }
}
