import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
  HandleRelationshipDto,
  RelationshipAction,
} from './dto';
import { RelationshipType } from '@prisma/client';

// Estados de relación
export const RelationshipStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  BLOCKED: 'BLOCKED',
} as const;

@Injectable()
export class UserRelationshipService {
  private readonly logger = new Logger(UserRelationshipService.name);

  constructor(private readonly prisma: PrismaService) { }

  // ==================== HELPERS ====================

  private async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            jobTitle: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  private formatUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      profilePhotoUrl: user.profile?.profilePhotoUrl,
      jobTitle: user.profile?.jobTitle,
    };
  }

  // ==================== CREATE RELATIONSHIP ====================

  async createRelationship(userId: string, dto: CreateRelationshipDto) {
    // No puedes crear relación contigo mismo
    if (userId === dto.relatedUserId) {
      throw new BadRequestException('No puedes crear una relación contigo mismo');
    }

    // Verificar que el usuario relacionado existe
    await this.getUserById(dto.relatedUserId);

    // Verificar si ya existe una relación (en cualquier dirección)
    const existingRelationship = await this.prisma.userRelationship.findFirst({
      where: {
        OR: [
          { userId: userId, relatedUserId: dto.relatedUserId },
          { userId: dto.relatedUserId, relatedUserId: userId },
        ],
      },
    });

    if (existingRelationship) {
      if (existingRelationship.status === RelationshipStatus.BLOCKED) {
        throw new ForbiddenException('No puedes crear una relación con este usuario');
      }
      throw new ConflictException('Ya existe una relación con este usuario');
    }

    const relationship = await this.prisma.userRelationship.create({
      data: {
        userId: userId,
        relatedUserId: dto.relatedUserId,
        relationshipType: dto.relationshipType,
        status: RelationshipStatus.PENDING,
      },
      include: {
        relatedUser: {
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

    this.logger.log(`User ${userId} sent relationship request to ${dto.relatedUserId}`);

    return {
      message: 'Solicitud de conexión enviada',
      relationship,
    };
  }

  // ==================== HANDLE RELATIONSHIP REQUEST ====================

  async handleRelationshipRequest(userId: string, dto: HandleRelationshipDto) {
    const relationship = await this.prisma.userRelationship.findUnique({
      where: { id: dto.relationshipId },
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
    });

    if (!relationship) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // Solo el usuario que recibe la solicitud puede aceptar/rechazar
    if (relationship.relatedUserId !== userId) {
      throw new ForbiddenException('No tienes permisos para gestionar esta solicitud');
    }

    if (relationship.status !== RelationshipStatus.PENDING) {
      throw new ConflictException('Esta solicitud ya fue procesada');
    }

    let newStatus: string;
    let message: string;

    switch (dto.action) {
      case RelationshipAction.ACCEPT:
        newStatus = RelationshipStatus.ACCEPTED;
        message = 'Solicitud aceptada';
        break;
      case RelationshipAction.REJECT:
        // Eliminar la solicitud rechazada
        await this.prisma.userRelationship.delete({
          where: { id: dto.relationshipId },
        });
        return { message: 'Solicitud rechazada' };
      case RelationshipAction.BLOCK:
        newStatus = RelationshipStatus.BLOCKED;
        message = 'Usuario bloqueado';
        break;
      default:
        throw new BadRequestException('Acción no válida');
    }

    await this.prisma.userRelationship.update({
      where: { id: dto.relationshipId },
      data: { status: newStatus },
    });

    this.logger.log(`Relationship ${dto.relationshipId} ${dto.action.toLowerCase()} by ${userId}`);

    return { message };
  }

  // ==================== GET RELATIONSHIPS ====================

  async getMyConnections(userId: string) {
    const relationships = await this.prisma.userRelationship.findMany({
      where: {
        OR: [
          { userId: userId, status: RelationshipStatus.ACCEPTED },
          { relatedUserId: userId, status: RelationshipStatus.ACCEPTED },
        ],
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
                jobTitle: true,
              },
            },
          },
        },
        relatedUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
                jobTitle: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Formatear para devolver el usuario conectado (no el actual)
    return relationships.map((rel) => {
      const connectedUser = rel.userId === userId ? rel.relatedUser : rel.user;
      return {
        relationshipId: rel.id,
        relationshipType: rel.relationshipType,
        connectedAt: rel.updatedAt,
        user: this.formatUserResponse(connectedUser),
      };
    });
  }

  async getPendingRequestsReceived(userId: string) {
    const requests = await this.prisma.userRelationship.findMany({
      where: {
        relatedUserId: userId,
        status: RelationshipStatus.PENDING,
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
                jobTitle: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req) => ({
      relationshipId: req.id,
      relationshipType: req.relationshipType,
      requestedAt: req.createdAt,
      from: this.formatUserResponse(req.user),
    }));
  }

  async getPendingRequestsSent(userId: string) {
    const requests = await this.prisma.userRelationship.findMany({
      where: {
        userId: userId,
        status: RelationshipStatus.PENDING,
      },
      include: {
        relatedUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
                jobTitle: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req) => ({
      relationshipId: req.id,
      relationshipType: req.relationshipType,
      requestedAt: req.createdAt,
      to: this.formatUserResponse(req.relatedUser),
    }));
  }

  async getBlockedUsers(userId: string) {
    const blocked = await this.prisma.userRelationship.findMany({
      where: {
        OR: [
          { userId: userId, status: RelationshipStatus.BLOCKED },
          { relatedUserId: userId, status: RelationshipStatus.BLOCKED },
        ],
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
        relatedUser: {
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

    return blocked.map((rel) => {
      const blockedUser = rel.userId === userId ? rel.relatedUser : rel.user;
      return {
        relationshipId: rel.id,
        blockedAt: rel.updatedAt,
        user: this.formatUserResponse(blockedUser),
      };
    });
  }

  async getConnectionsByType(userId: string, type: RelationshipType) {
    const relationships = await this.prisma.userRelationship.findMany({
      where: {
        OR: [
          { userId: userId, status: RelationshipStatus.ACCEPTED, relationshipType: type },
          { relatedUserId: userId, status: RelationshipStatus.ACCEPTED, relationshipType: type },
        ],
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
                jobTitle: true,
              },
            },
          },
        },
        relatedUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
                jobTitle: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return relationships.map((rel) => {
      const connectedUser = rel.userId === userId ? rel.relatedUser : rel.user;
      return {
        relationshipId: rel.id,
        connectedAt: rel.updatedAt,
        user: this.formatUserResponse(connectedUser),
      };
    });
  }

  // ==================== UPDATE RELATIONSHIP ====================

  async updateRelationship(relationshipId: string, userId: string, dto: UpdateRelationshipDto) {
    const relationship = await this.prisma.userRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new NotFoundException('Relación no encontrada');
    }

    // Verificar que el usuario es parte de la relación
    if (relationship.userId !== userId && relationship.relatedUserId !== userId) {
      throw new ForbiddenException('No tienes permisos para modificar esta relación');
    }

    if (relationship.status !== RelationshipStatus.ACCEPTED) {
      throw new ConflictException('Solo puedes modificar relaciones aceptadas');
    }

    return this.prisma.userRelationship.update({
      where: { id: relationshipId },
      data: {
        relationshipType: dto.relationshipType,
      },
    });
  }

  // ==================== DELETE/REMOVE RELATIONSHIP ====================

  async removeConnection(relationshipId: string, userId: string) {
    const relationship = await this.prisma.userRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new NotFoundException('Relación no encontrada');
    }

    // Verificar que el usuario es parte de la relación
    if (relationship.userId !== userId && relationship.relatedUserId !== userId) {
      throw new ForbiddenException('No tienes permisos para eliminar esta relación');
    }

    await this.prisma.userRelationship.delete({
      where: { id: relationshipId },
    });

    return { message: 'Conexión eliminada correctamente' };
  }

  async cancelPendingRequest(relationshipId: string, userId: string) {
    const relationship = await this.prisma.userRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // Solo quien envió la solicitud puede cancelarla
    if (relationship.userId !== userId) {
      throw new ForbiddenException('No puedes cancelar esta solicitud');
    }

    if (relationship.status !== RelationshipStatus.PENDING) {
      throw new ConflictException('Solo puedes cancelar solicitudes pendientes');
    }

    await this.prisma.userRelationship.delete({
      where: { id: relationshipId },
    });

    return { message: 'Solicitud cancelada' };
  }

  // ==================== BLOCK/UNBLOCK ====================

  async blockUser(targetUserId: string, userId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('No puedes bloquearte a ti mismo');
    }

    await this.getUserById(targetUserId);

    // Buscar relación existente
    const existingRelationship = await this.prisma.userRelationship.findFirst({
      where: {
        OR: [
          { userId: userId, relatedUserId: targetUserId },
          { userId: targetUserId, relatedUserId: userId },
        ],
      },
    });

    if (existingRelationship) {
      // Actualizar a bloqueado
      await this.prisma.userRelationship.update({
        where: { id: existingRelationship.id },
        data: { status: RelationshipStatus.BLOCKED },
      });
    } else {
      // Crear nueva relación bloqueada
      await this.prisma.userRelationship.create({
        data: {
          userId: userId,
          relatedUserId: targetUserId,
          relationshipType: RelationshipType.CONTACT,
          status: RelationshipStatus.BLOCKED,
        },
      });
    }

    this.logger.log(`User ${userId} blocked user ${targetUserId}`);
    return { message: 'Usuario bloqueado' };
  }

  async unblockUser(relationshipId: string, userId: string) {
    const relationship = await this.prisma.userRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new NotFoundException('Relación no encontrada');
    }

    if (relationship.status !== RelationshipStatus.BLOCKED) {
      throw new ConflictException('Este usuario no está bloqueado');
    }

    // Verificar que el usuario actual es quien bloqueó
    if (relationship.userId !== userId && relationship.relatedUserId !== userId) {
      throw new ForbiddenException('No tienes permisos para desbloquear');
    }

    // Eliminar la relación de bloqueo
    await this.prisma.userRelationship.delete({
      where: { id: relationshipId },
    });

    return { message: 'Usuario desbloqueado' };
  }

  // ==================== STATS ====================

  async getConnectionStats(userId: string) {
    const [
      totalConnections,
      pendingReceived,
      pendingSent,
      blockedCount,
      connectionsByType,
    ] = await Promise.all([
      this.prisma.userRelationship.count({
        where: {
          OR: [
            { userId: userId, status: RelationshipStatus.ACCEPTED },
            { relatedUserId: userId, status: RelationshipStatus.ACCEPTED },
          ],
        },
      }),
      this.prisma.userRelationship.count({
        where: {
          relatedUserId: userId,
          status: RelationshipStatus.PENDING,
        },
      }),
      this.prisma.userRelationship.count({
        where: {
          userId: userId,
          status: RelationshipStatus.PENDING,
        },
      }),
      this.prisma.userRelationship.count({
        where: {
          OR: [
            { userId: userId, status: RelationshipStatus.BLOCKED },
            { relatedUserId: userId, status: RelationshipStatus.BLOCKED },
          ],
        },
      }),
      this.prisma.userRelationship.groupBy({
        by: ['relationshipType'],
        where: {
          OR: [
            { userId: userId, status: RelationshipStatus.ACCEPTED },
            { relatedUserId: userId, status: RelationshipStatus.ACCEPTED },
          ],
        },
        _count: true,
      }),
    ]);

    return {
      totalConnections,
      pendingReceived,
      pendingSent,
      blockedCount,
      byType: connectionsByType.reduce((acc, item) => {
        acc[item.relationshipType] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // ==================== CHECK RELATIONSHIP ====================

  async checkRelationship(userId: string, targetUserId: string) {
    const relationship = await this.prisma.userRelationship.findFirst({
      where: {
        OR: [
          { userId: userId, relatedUserId: targetUserId },
          { userId: targetUserId, relatedUserId: userId },
        ],
      },
    });

    if (!relationship) {
      return {
        isConnected: false,
        status: null,
        relationshipType: null,
      };
    }

    return {
      isConnected: relationship.status === RelationshipStatus.ACCEPTED,
      status: relationship.status,
      relationshipType: relationship.relationshipType,
      relationshipId: relationship.id,
      initiatedByMe: relationship.userId === userId,
    };
  }
}
