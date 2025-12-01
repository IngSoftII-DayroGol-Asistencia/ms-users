import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const membership = await this.prisma.userEnterprise.findFirst({
      where: {
        userId: user.id,
        isOwner: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Solo el propietario puede realizar esta acción');
    }

    request.membership = membership;
    return true;
  }
}
