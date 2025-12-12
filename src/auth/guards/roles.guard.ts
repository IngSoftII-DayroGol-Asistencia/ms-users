import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, SystemRoles } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Obtener la membresía del usuario en la empresa
    const membership = await this.prisma.userEnterprise.findFirst({
      where: { userId: user.id },
      include: {
        user: {
          include: {
            roles: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('No perteneces a ninguna empresa');
    }

    // Agregar información de membresía al request
    request.membership = membership;

    // Si es OWNER, tiene todos los permisos
    if (membership.isOwner && requiredRoles.includes(SystemRoles.OWNER)) {
      return true;
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const userRoleNames = membership.user.roles.map(role => role.name.toUpperCase());

    // OWNER siempre tiene acceso
    if (membership.isOwner) {
      return true;
    }

    const hasRole = requiredRoles.some(role =>
      userRoleNames.includes(role.toUpperCase())
    );

    if (!hasRole) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    return true;
  }
}
