import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignEnterprisePermissionDto,
  BulkAssignPermissionsDto,
} from './dto';
import { PermissionAction, ResourceType } from '@prisma/client';

@Injectable()
export class EnterprisePermissionService {
  private readonly logger = new Logger(EnterprisePermissionService.name);

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
      throw new ForbiddenException('Solo el propietario puede gestionar permisos de empresa');
    }

    return membership;
  }

  private async getEnterpriseByUserId(userId: string) {
    const membership = await this.prisma.userEnterprise.findFirst({
      where: { userId },
    });

    if (!membership) {
      throw new NotFoundException('No perteneces a ninguna empresa');
    }

    return membership;
  }

  // ==================== ASSIGN PERMISSION TO ENTERPRISE ====================

  async assignPermissionToEnterprise(
    userId: string,
    dto: AssignEnterprisePermissionDto,
  ) {
    const membership = await this.verifyOwnership(userId);

    // Verificar que el permiso existe
    const permission = await this.prisma.permission.findUnique({
      where: { id: dto.permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permiso no encontrado');
    }

    // Verificar si ya existe este permiso en la empresa
    const existingPermission = await this.prisma.enterprisePermission.findUnique({
      where: {
        enterpriseId_permissionId: {
          enterpriseId: membership.enterpriseId,
          permissionId: dto.permissionId,
        },
      },
    });

    if (existingPermission) {
      throw new ConflictException('Este permiso ya está asignado a la empresa');
    }

    const enterprisePermission = await this.prisma.enterprisePermission.create({
      data: {
        enterpriseId: membership.enterpriseId,
        permissionId: dto.permissionId,
        grantedBy: userId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        permission: true,
        grantedByUser: {
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
    });

    this.logger.log(
      `Permission ${permission.name} assigned to enterprise ${membership.enterpriseId} by ${userId}`,
    );

    return {
      message: `Permiso "${permission.name}" asignado a la empresa`,
      enterprisePermission,
    };
  }

  // ==================== BULK ASSIGN PERMISSIONS ====================

  async bulkAssignPermissions(userId: string, dto: BulkAssignPermissionsDto) {
    const membership = await this.verifyOwnership(userId);

    // Verificar que todos los permisos existen
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: dto.permissionIds },
      },
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new NotFoundException('Algunos permisos no fueron encontrados');
    }

    // Obtener permisos ya existentes en la empresa
    const existingPermissions = await this.prisma.enterprisePermission.findMany({
      where: {
        enterpriseId: membership.enterpriseId,
        permissionId: { in: dto.permissionIds },
      },
    });

    const existingPermissionIds = existingPermissions.map((ep) => ep.permissionId);
    const newPermissionIds = dto.permissionIds.filter(
      (id) => !existingPermissionIds.includes(id),
    );

    if (newPermissionIds.length === 0) {
      throw new ConflictException('Todos los permisos ya están asignados a la empresa');
    }

    // Crear los nuevos permisos
    const createdPermissions = await this.prisma.enterprisePermission.createMany({
      data: newPermissionIds.map((permissionId) => ({
        enterpriseId: membership.enterpriseId,
        permissionId,
        grantedBy: userId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      })),
    });

    this.logger.log(
      `${createdPermissions.count} permissions assigned to enterprise ${membership.enterpriseId}`,
    );

    return {
      message: `${createdPermissions.count} permisos asignados a la empresa`,
      assigned: createdPermissions.count,
      skipped: existingPermissionIds.length,
    };
  }

  // ==================== REVOKE PERMISSION ====================

  async revokePermission(enterprisePermissionId: string, userId: string) {
    const membership = await this.verifyOwnership(userId);

    const enterprisePermission = await this.prisma.enterprisePermission.findUnique({
      where: { id: enterprisePermissionId },
      include: { permission: true },
    });

    if (!enterprisePermission) {
      throw new NotFoundException('Permiso de empresa no encontrado');
    }

    if (enterprisePermission.enterpriseId !== membership.enterpriseId) {
      throw new ForbiddenException('No tienes permisos para revocar este permiso');
    }

    await this.prisma.enterprisePermission.delete({
      where: { id: enterprisePermissionId },
    });

    this.logger.log(
      `Permission ${enterprisePermission.permission.name} revoked from enterprise ${membership.enterpriseId}`,
    );

    return {
      message: `Permiso "${enterprisePermission.permission.name}" revocado de la empresa`,
    };
  }

  // ==================== GET ENTERPRISE PERMISSIONS ====================

  async getEnterprisePermissions(userId: string) {
    const membership = await this.getEnterpriseByUserId(userId);

    const permissions = await this.prisma.enterprisePermission.findMany({
      where: {
        enterpriseId: membership.enterpriseId,
      },
      include: {
        permission: true,
        grantedByUser: {
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
      orderBy: [
        { permission: { resource: 'asc' } },
        { permission: { action: 'asc' } },
      ],
    });

    // Agrupar por recurso
    const groupedByResource = permissions.reduce((acc, ep) => {
      const resource = ep.permission.resource;
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push({
        id: ep.id,
        permissionId: ep.permissionId,
        name: ep.permission.name,
        action: ep.permission.action,
        description: ep.permission.description,
        grantedAt: ep.grantedAt,
        expiresAt: ep.expiresAt,
        grantedBy: ep.grantedByUser,
        isExpired: ep.expiresAt ? new Date(ep.expiresAt) < new Date() : false,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return {
      total: permissions.length,
      permissions: groupedByResource,
    };
  }

  // ==================== GET AVAILABLE PERMISSIONS ====================

  async getAvailablePermissions(userId: string) {
    const membership = await this.getEnterpriseByUserId(userId);

    // Obtener todos los permisos
    const allPermissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Obtener permisos ya asignados a la empresa
    const assignedPermissions = await this.prisma.enterprisePermission.findMany({
      where: { enterpriseId: membership.enterpriseId },
      select: { permissionId: true },
    });

    const assignedPermissionIds = new Set(
      assignedPermissions.map((ap) => ap.permissionId),
    );

    // Separar en asignados y disponibles
    const available: typeof allPermissions = [];
    const assigned: typeof allPermissions = [];

    allPermissions.forEach((permission) => {
      if (assignedPermissionIds.has(permission.id)) {
        assigned.push(permission);
      } else {
        available.push(permission);
      }
    });

    // Agrupar por recurso
    const groupByResource = (permissions: typeof allPermissions) => {
      return permissions.reduce((acc, p) => {
        if (!acc[p.resource]) {
          acc[p.resource] = [];
        }
        acc[p.resource].push(p);
        return acc;
      }, {} as Record<string, typeof allPermissions>);
    };

    return {
      available: {
        total: available.length,
        permissions: groupByResource(available),
      },
      assigned: {
        total: assigned.length,
        permissions: groupByResource(assigned),
      },
    };
  }

  // ==================== CHECK ENTERPRISE PERMISSION ====================

  async checkEnterprisePermission(
    userId: string,
    action: PermissionAction,
    resource: ResourceType,
  ): Promise<boolean> {
    const membership = await this.prisma.userEnterprise.findFirst({
      where: { userId },
    });

    if (!membership) {
      return false;
    }

    // Si es owner, tiene todos los permisos
    if (membership.isOwner) {
      return true;
    }

    const permission = await this.prisma.enterprisePermission.findFirst({
      where: {
        enterpriseId: membership.enterpriseId,
        permission: {
          action,
          resource,
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return !!permission;
  }

  // ==================== GET PERMISSIONS BY RESOURCE ====================

  async getPermissionsByResource(userId: string, resource: ResourceType) {
    const membership = await this.getEnterpriseByUserId(userId);

    const permissions = await this.prisma.enterprisePermission.findMany({
      where: {
        enterpriseId: membership.enterpriseId,
        permission: {
          resource,
        },
      },
      include: {
        permission: true,
      },
    });

    return permissions.map((ep) => ({
      id: ep.id,
      action: ep.permission.action,
      name: ep.permission.name,
      description: ep.permission.description,
      expiresAt: ep.expiresAt,
      isExpired: ep.expiresAt ? new Date(ep.expiresAt) < new Date() : false,
    }));
  }

  // ==================== UPDATE PERMISSION EXPIRATION ====================

  async updatePermissionExpiration(
    enterprisePermissionId: string,
    userId: string,
    expiresAt: string | null,
  ) {
    const membership = await this.verifyOwnership(userId);

    const enterprisePermission = await this.prisma.enterprisePermission.findUnique({
      where: { id: enterprisePermissionId },
      include: { permission: true },
    });

    if (!enterprisePermission) {
      throw new NotFoundException('Permiso de empresa no encontrado');
    }

    if (enterprisePermission.enterpriseId !== membership.enterpriseId) {
      throw new ForbiddenException('No tienes permisos para modificar este permiso');
    }

    const updated = await this.prisma.enterprisePermission.update({
      where: { id: enterprisePermissionId },
      data: {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        permission: true,
      },
    });

    return {
      message: 'Fecha de expiración actualizada',
      permission: updated,
    };
  }

  // ==================== SEED DEFAULT PERMISSIONS ====================

  async seedDefaultPermissions() {
    const existingPermissions = await this.prisma.permission.count();

    if (existingPermissions > 0) {
      return { message: 'Los permisos ya existen', count: existingPermissions };
    }

    const permissionsToCreate: {
      name: string;
      description: string;
      action: PermissionAction;
      resource: ResourceType;
    }[] = [];

    // Generar permisos para cada combinación de acción y recurso
    const actions = Object.values(PermissionAction);
    const resources = Object.values(ResourceType);

    resources.forEach((resource) => {
      actions.forEach((action) => {
        permissionsToCreate.push({
          name: `${action}_${resource}`,
          description: `Permite ${action.toLowerCase()} en ${resource.toLowerCase()}`,
          action,
          resource,
        });
      });
    });

    const result = await this.prisma.permission.createMany({
      data: permissionsToCreate,
      skipDuplicates: true,
    });

    this.logger.log(`Created ${result.count} default permissions`);

    return {
      message: `${result.count} permisos creados`,
      count: result.count,
    };
  }
}
