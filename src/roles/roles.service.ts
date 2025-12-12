import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) { }

  // ==================== HELPERS ====================

  private async getUserEnterprise(userId: string) {
    const membership = await this.prisma.userEnterprise.findFirst({
      where: { userId },
    });

    if (!membership) {
      throw new ForbiddenException('No perteneces a ninguna empresa');
    }

    return membership;
  }

  private async verifyOwnership(userId: string, enterpriseId?: string) {
    const membership = await this.prisma.userEnterprise.findFirst({
      where: {
        userId,
        isOwner: true,
        ...(enterpriseId && { enterpriseId }),
      },
    });

    if (!membership) {
      throw new ForbiddenException('Solo el propietario puede realizar esta acción');
    }

    return membership;
  }

  private async verifyUserInSameEnterprise(userId: string, targetUserId: string) {
    const [userMembership, targetMembership] = await Promise.all([
      this.prisma.userEnterprise.findFirst({ where: { userId } }),
      this.prisma.userEnterprise.findFirst({ where: { userId: targetUserId } }),
    ]);

    if (!userMembership || !targetMembership) {
      throw new NotFoundException('Usuario no encontrado en la empresa');
    }

    if (userMembership.enterpriseId !== targetMembership.enterpriseId) {
      throw new ForbiddenException('El usuario no pertenece a tu empresa');
    }

    return { userMembership, targetMembership };
  }

  // ==================== CRUD ROLES ====================

  async create(createRoleDto: CreateRoleDto, userId: string) {
    const membership = await this.verifyOwnership(userId);

    try {
      const role = await this.prisma.role.create({
        data: {
          name: createRoleDto.name,
          description: createRoleDto.description,
          enterpriseId: membership.enterpriseId,
          isSystem: false,
          isCustom: true,
          ...(createRoleDto.permissionIds && {
            permissions: {
              connect: createRoleDto.permissionIds.map(id => ({ id })),
            },
          }),
        },
        include: {
          permissions: true,
        },
      });

      this.logger.log(`Role ${role.name} created for enterprise ${membership.enterpriseId}`);
      return role;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un rol con ese nombre en tu empresa');
      }
      this.logger.error('Error creating role', error);
      throw new HttpException('Error al crear el rol', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(userId: string) {
    const membership = await this.getUserEnterprise(userId);

    return this.prisma.role.findMany({
      where: { enterpriseId: membership.enterpriseId },
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const membership = await this.getUserEnterprise(userId);

    const role = await this.prisma.role.findFirst({
      where: {
        id,
        enterpriseId: membership.enterpriseId,
      },
      include: {
        permissions: true,
        users: {
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

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, userId: string) {
    await this.verifyOwnership(userId);
    const membership = await this.getUserEnterprise(userId);

    const role = await this.prisma.role.findFirst({
      where: {
        id,
        enterpriseId: membership.enterpriseId,
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (role.isSystem) {
      throw new ForbiddenException('No puedes modificar roles del sistema');
    }

    try {
      return await this.prisma.role.update({
        where: { id },
        data: {
          name: updateRoleDto.name,
          description: updateRoleDto.description,
          ...(updateRoleDto.permissionIds && {
            permissions: {
              set: updateRoleDto.permissionIds.map(permId => ({ id: permId })),
            },
          }),
        },
        include: {
          permissions: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un rol con ese nombre');
      }
      throw new HttpException('Error al actualizar el rol', HttpStatus.BAD_REQUEST);
    }
  }

  async remove(id: string, userId: string) {
    await this.verifyOwnership(userId);
    const membership = await this.getUserEnterprise(userId);

    const role = await this.prisma.role.findFirst({
      where: {
        id,
        enterpriseId: membership.enterpriseId,
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (role.isSystem) {
      throw new ForbiddenException('No puedes eliminar roles del sistema');
    }

    await this.prisma.role.delete({ where: { id } });

    return { message: 'Rol eliminado correctamente' };
  }

  // ==================== ASSIGN/REMOVE ROLES ====================

  async assignRoleToUser(assignRoleDto: AssignRoleDto, adminUserId: string) {
    await this.verifyOwnership(adminUserId);

    const { userMembership, targetMembership } = await this.verifyUserInSameEnterprise(
      adminUserId,
      assignRoleDto.userId
    );

    const role = await this.prisma.role.findFirst({
      where: {
        id: assignRoleDto.roleId,
        enterpriseId: userMembership.enterpriseId,
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // Verificar si el usuario ya tiene el rol
    const existingRole = await this.prisma.user.findFirst({
      where: {
        id: assignRoleDto.userId,
        roles: {
          some: { id: assignRoleDto.roleId },
        },
      },
    });

    if (existingRole) {
      throw new ConflictException('El usuario ya tiene este rol asignado');
    }

    await this.prisma.user.update({
      where: { id: assignRoleDto.userId },
      data: {
        roles: {
          connect: { id: assignRoleDto.roleId },
        },
      },
    });

    this.logger.log(`Role ${role.name} assigned to user ${assignRoleDto.userId}`);
    return { message: `Rol ${role.name} asignado correctamente` };
  }

  async removeRoleFromUser(assignRoleDto: AssignRoleDto, adminUserId: string) {
    await this.verifyOwnership(adminUserId);

    await this.verifyUserInSameEnterprise(adminUserId, assignRoleDto.userId);

    await this.prisma.user.update({
      where: { id: assignRoleDto.userId },
      data: {
        roles: {
          disconnect: { id: assignRoleDto.roleId },
        },
      },
    });

    return { message: 'Rol removido correctamente' };
  }

  async getUserRoles(targetUserId: string, userId: string) {
    await this.verifyUserInSameEnterprise(userId, targetUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async getMyRoles(userId: string) {
    const membership = await this.getUserEnterprise(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        roles: {
          where: { enterpriseId: membership.enterpriseId },
          include: {
            permissions: true,
          },
        },
      },
    });

    return {
      ...user,
      isOwner: membership.isOwner,
    };
  }

  // ==================== PERMISSIONS ====================

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ]
    });
  }

  async addPermissionToRole(roleId: string, permissionId: string, userId: string) {
    await this.verifyOwnership(userId);
    const membership = await this.getUserEnterprise(userId);

    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        enterpriseId: membership.enterpriseId,
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (role.isSystem) {
      throw new ForbiddenException('No puedes modificar roles del sistema');
    }

    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: { id: permissionId },
        },
      },
    });

    return { message: 'Permiso agregado al rol' };
  }

  async removePermissionFromRole(roleId: string, permissionId: string, userId: string) {
    await this.verifyOwnership(userId);
    const membership = await this.getUserEnterprise(userId);

    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        enterpriseId: membership.enterpriseId,
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (role.isSystem) {
      throw new ForbiddenException('No puedes modificar roles del sistema');
    }

    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: { id: permissionId },
        },
      },
    });

    return { message: 'Permiso removido del rol' };
  }
}
