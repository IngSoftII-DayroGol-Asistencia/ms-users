import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EnterprisePermissionService } from '../../enterprise-permission/enterprise-permission.service';
import { PermissionAction, ResourceType } from '@prisma/client';

export const PERMISSION_KEY = 'permission';

export interface PermissionRequirement {
  action: PermissionAction;
  resource: ResourceType;
}

import { SetMetadata } from '@nestjs/common';

export const RequirePermission = (action: PermissionAction, resource: ResourceType) =>
  SetMetadata(PERMISSION_KEY, { action, resource });

@Injectable()
export class EnterprisePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private enterprisePermissionService: EnterprisePermissionService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const hasPermission = await this.enterprisePermissionService.checkEnterprisePermission(
      user.id,
      requirement.action,
      requirement.resource,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `No tienes permiso para ${requirement.action} en ${requirement.resource}`,
      );
    }

    return true;
  }
}
