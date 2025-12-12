import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignPermissionDto,
  BulkAssignUserPermissionsDto,
  UpdatePermissionAssignmentDto,
} from './dto';
import { PermissionAction, ResourceType } from '@prisma/client';

@Injectable()
export class PermissionAssignmentService {
  private readonly logger = new Logger(PermissionAssignmentService.name);

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
      throw new ForbiddenException('Solo el propietario puede gestionar permisos de usuarios');
    }

    return membership;
  }

  private async verifyUserInSameEnterprise(adminUserId: string, targetUserId: string) {
    const [adminMembership, targetMembership] = await Promise.all([
      this.prisma.userEnterprise.findFirst({ where: { userId: adminUserId } }),
      this.prisma.userEnterprise.findFirst({ where: { userId: targetUserId } }),
    ]);

    if (!adminMembership) {
      throw new ForbiddenException('No perteneces a ninguna empresa');
    }

    if (!targetMembership) {
      throw new NotFoundException('El usuario no pertenece a ninguna empresa');
    }

    if (adminMembership.enterpriseId !== targetMembership.enterpriseId) {
      throw new ForbiddenException('El usuario no pertenece a tu empresa');
    }

    return { adminMembership, targetMembership };
  }

  private async getMyMembership(userId: string) {
    const membership = await this.prisma.userEnterprise.findFirst({
      where: { userId },
    });

    if (!membership) {
      throw new NotFoundException('No perteneces a ninguna empresa');
    }

    return membership;
  }

  // ==================== ASSIGN PERMISSION TO USER ====================

  async assignPermissionToUser(adminUserId: string, dto: AssignPermissionDto) {
    await this.verifyOwnership(adminUserId);
    await this.verifyUserInSameEnterprise(adminUserId, dto.userId);

    const permission = await this.prisma.permission.findUnique({
      where: { id: dto.permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permiso no encontrado');
    }

    const existingAssignment = await this.prisma.permissionAssignment.findUnique({
      where: {
        userId_permissionId: {
          userId: dto.userId,
          permissionId: dto.permissionId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException('El usuario ya tiene este permiso asignado');
    }

    const assignment = await this.prisma.permissionAssignment.create({
      data: {
        userId: dto.userId,
        permissionId: dto.permissionId,
        grantedBy: adminUserId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        permission: true,
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
    });

    this.logger.log(
      `Permission ${permission.name} assigned to user ${dto.userId} by ${adminUserId}`,
    );

    return {
      message: `Permiso "${permission.name}" asignado al usuario`,
      assignment,
    };
  }

  // ==================== BULK ASSIGN PERMISSIONS ====================

  async bulkAssignPermissions(adminUserId: string, dto: BulkAssignUserPermissionsDto) {
    await this.verifyOwnership(adminUserId);
    await this.verifyUserInSameEnterprise(adminUserId, dto.userId);

    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: dto.permissionIds },
      },
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new NotFoundException('Algunos permisos no fueron encontrados');
    }

    const existingAssignments = await this.prisma.permissionAssignment.findMany({
      where: {
        userId: dto.userId,
        permissionId: { in: dto.permissionIds },
      },
    });

    const existingPermissionIds = existingAssignments.map((a) => a.permissionId);
    const newPermissionIds = dto.permissionIds.filter(
      (id) => !existingPermissionIds.includes(id),
    );

    if (newPermissionIds.length === 0) {
      throw new ConflictException('El usuario ya tiene todos estos permisos asignados');
    }

    const result = await this.prisma.permissionAssignment.createMany({
      data: newPermissionIds.map((permissionId) => ({
        userId: dto.userId,
        permissionId,
        grantedBy: adminUserId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      })),
    });

    this.logger.log(
      `${result.count} permissions assigned to user ${dto.userId} by ${adminUserId}`,
    );

    return {
      message: `${result.count} permisos asignados al usuario`,
      assigned: result.count,
      skipped: existingPermissionIds.length,
    };
  }

  // ==================== REVOKE PERMISSION ====================

  async revokePermission(assignmentId: string, adminUserId: string) {
    await this.verifyOwnership(adminUserId);

    const assignment = await this.prisma.permissionAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        permission: true,
        user: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación de permiso no encontrada');
    }

    await this.verifyUserInSameEnterprise(adminUserId, assignment.userId);

    await this.prisma.permissionAssignment.delete({
      where: { id: assignmentId },
    });

    this.logger.log(
      `Permission ${assignment.permission.name} revoked from user ${assignment.userId}`,
    );

    return {
      message: `Permiso "${assignment.permission.name}" revocado del usuario`,
    };
  }

  // ==================== REVOKE ALL USER PERMISSIONS ====================

  async revokeAllUserPermissions(targetUserId: string, adminUserId: string) {
    await this.verifyOwnership(adminUserId);
    await this.verifyUserInSameEnterprise(adminUserId, targetUserId);

    const result = await this.prisma.permissionAssignment.deleteMany({
      where: { userId: targetUserId },
    });

    this.logger.log(
      `All permissions (${result.count}) revoked from user ${targetUserId}`,
    );

    return {
      message: `${result.count} permisos revocados del usuario`,
      count: result.count,
    };
  }

  // ==================== GET USER PERMISSIONS ====================

  async getUserPermissions(targetUserId: string, adminUserId: string) {
    await this.verifyUserInSameEnterprise(adminUserId, targetUserId);

    const assignments = await this.prisma.permissionAssignment.findMany({
      where: { userId: targetUserId },
      include: {
        permission: true,
      },
      orderBy: [
        { permission: { resource: 'asc' } },
        { permission: { action: 'asc' } },
      ],
    });

    const groupedByResource = assignments.reduce((acc, assignment) => {
      const resource = assignment.permission.resource;
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push({
        assignmentId: assignment.id,
        permissionId: assignment.permissionId,
        name: assignment.permission.name,
        action: assignment.permission.action,
        description: assignment.permission.description,
        grantedAt: assignment.grantedAt,
        expiresAt: assignment.expiresAt,
        isExpired: assignment.expiresAt
          ? new Date(assignment.expiresAt) < new Date()
          : false,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return {
      userId: targetUserId,
      total: assignments.length,
      permissions: groupedByResource,
    };
  }

  // ==================== GET MY PERMISSIONS ====================

  async getMyPermissions(userId: string) {
    const membership = await this.getMyMembership(userId);

    // Obtener permisos directos del usuario
    const directPermissions = await this.prisma.permissionAssignment.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        permission: true,
      },
    });

    const rolePermissions = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: {
          where: { enterpriseId: membership.enterpriseId },
          include: {
            permissions: true,
          },
        },
      },
    });

    const allPermissions = new Map<string, any>();

    directPermissions.forEach((dp) => {
      allPermissions.set(dp.permissionId, {
        id: dp.permission.id,
        name: dp.permission.name,
        action: dp.permission.action,
        resource: dp.permission.resource,
        description: dp.permission.description,
        source: 'direct',
        expiresAt: dp.expiresAt,
      });
    });

    rolePermissions?.roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        if (!allPermissions.has(permission.id)) {
          allPermissions.set(permission.id, {
            id: permission.id,
            name: permission.name,
            action: permission.action,
            resource: permission.resource,
            description: permission.description,
            source: 'role',
            roleName: role.name,
          });
        }
      });
    });

    // Agrupar por recurso
    const permissionsList = Array.from(allPermissions.values());
    const groupedByResource = permissionsList.reduce((acc, p) => {
      if (!acc[p.resource]) {
        acc[p.resource] = [];
      }
      acc[p.resource].push(p);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      isOwner: membership.isOwner,
      total: permissionsList.length,
      permissions: groupedByResource,
    };
  }

  // ==================== CHECK USER PERMISSION ====================

  async checkUserPermission(
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

    if (membership.isOwner) {
      return true;
    }

    const directPermission = await this.prisma.permissionAssignment.findFirst({
      where: {
        userId,
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

    if (directPermission) {
      return true;
    }

    const rolePermission = await this.prisma.user.findFirst({
      where: {
        id: userId,
        roles: {
          some: {
            enterpriseId: membership.enterpriseId,
            permissions: {
              some: {
                action,
                resource,
              },
            },
          },
        },
      },
    });

    return !!rolePermission;
  }

  // ==================== UPDATE ASSIGNMENT ====================

  async updateAssignment(
    assignmentId: string,
    adminUserId: string,
    dto: UpdatePermissionAssignmentDto,
  ) {
    await this.verifyOwnership(adminUserId);

    const assignment = await this.prisma.permissionAssignment.findUnique({
      where: { id: assignmentId },
      include: { permission: true },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    await this.verifyUserInSameEnterprise(adminUserId, assignment.userId);

    const updated = await this.prisma.permissionAssignment.update({
      where: { id: assignmentId },
      data: {
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        permission: true,
      },
    });

    return {
      message: 'Asignación actualizada',
      assignment: updated,
    };
  }

  // ==================== GET USERS WITH PERMISSION ====================

  async getUsersWithPermission(permissionId: string, adminUserId: string) {
    const membership = await this.verifyOwnership(adminUserId);

    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permiso no encontrado');
    }

    const directAssignments = await this.prisma.permissionAssignment.findMany({
      where: {
        permissionId,
        user: {
          enterprises: {
            some: { enterpriseId: membership.enterpriseId },
          },
        },
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
                profilePhotoUrl: true,
              },
            },
          },
        },
      },
    });

    const usersWithRolePermission = await this.prisma.user.findMany({
      where: {
        enterprises: {
          some: { enterpriseId: membership.enterpriseId },
        },
        roles: {
          some: {
            enterpriseId: membership.enterpriseId,
            permissions: {
              some: { id: permissionId },
            },
          },
        },
      },
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
        roles: {
          where: {
            enterpriseId: membership.enterpriseId,
            permissions: {
              some: { id: permissionId },
            },
          },
          select: {
            name: true,
          },
        },
      },
    });

    return {
      permission: {
        id: permission.id,
        name: permission.name,
        action: permission.action,
        resource: permission.resource,
      },
      directAssignments: directAssignments.map((a) => ({
        assignmentId: a.id,
        user: a.user,
        grantedAt: a.grantedAt,
        expiresAt: a.expiresAt,
      })),
      throughRoles: usersWithRolePermission.map((u) => ({
        user: {
          id: u.id,
          email: u.email,
          ...u.profile,
        },
        roles: u.roles.map((r) => r.name),
      })),
    };
  }

  // ==================== COPY PERMISSIONS ====================

  async copyPermissionsFromUser(
    sourceUserId: string,
    targetUserId: string,
    adminUserId: string,
  ) {
    await this.verifyOwnership(adminUserId);
    await this.verifyUserInSameEnterprise(adminUserId, sourceUserId);
    await this.verifyUserInSameEnterprise(adminUserId, targetUserId);

    // Obtener permisos del usuario origen
    const sourcePermissions = await this.prisma.permissionAssignment.findMany({
      where: { userId: sourceUserId },
    });

    if (sourcePermissions.length === 0) {
      throw new NotFoundException('El usuario origen no tiene permisos asignados');
    }

    const existingPermissions = await this.prisma.permissionAssignment.findMany({
      where: { userId: targetUserId },
    });

    const existingPermissionIds = new Set(existingPermissions.map((p) => p.permissionId));

    const permissionsToCreate = sourcePermissions.filter(
      (p) => !existingPermissionIds.has(p.permissionId),
    );

    if (permissionsToCreate.length === 0) {
      return {
        message: 'El usuario destino ya tiene todos los permisos del usuario origen',
        copied: 0,
      };
    }

    const result = await this.prisma.permissionAssignment.createMany({
      data: permissionsToCreate.map((p) => ({
        userId: targetUserId,
        permissionId: p.permissionId,
        grantedBy: adminUserId,
        expiresAt: p.expiresAt,
      })),
    });

    this.logger.log(
      `Copied ${result.count} permissions from user ${sourceUserId} to ${targetUserId}`,
    );

    return {
      message: `${result.count} permisos copiados al usuario`,
      copied: result.count,
      skipped: existingPermissionIds.size,
    };
  }
}
