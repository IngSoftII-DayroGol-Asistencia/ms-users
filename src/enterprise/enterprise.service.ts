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
import {
  CreateEnterpriseDto,
  UpdateEnterpriseDto,
  JoinEnterpriseDto,
  HandleJoinRequestDto,
  JoinRequestAction,
} from './dto';
import { JoinRequestStatus } from '@prisma/client';

@Injectable()
export class EnterpriseService {
  private readonly logger = new Logger(EnterpriseService.name);

  constructor(private readonly prisma: PrismaService) { }

  // ==================== HELPERS ====================

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

  private async verifyUserBelongsToEnterprise(userId: string, enterpriseId: string) {
    const membership = await this.prisma.userEnterprise.findUnique({
      where: {
        userId_enterpriseId: {
          userId,
          enterpriseId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    return membership;
  }

  // ==================== CRUD ENTERPRISE ====================

  async create(createEnterpriseDto: CreateEnterpriseDto, userId: string) {
    try {
      // Verificar si el usuario ya pertenece a una empresa
      const existingMembership = await this.prisma.userEnterprise.findFirst({
        where: { userId },
      });

      if (existingMembership) {
        throw new ConflictException('El usuario ya pertenece a una empresa');
      }

      // Crear la empresa y agregar al usuario como OWNER
      const enterprise = await this.prisma.enterprise.create({
        data: {
          name: createEnterpriseDto.name,
          description: createEnterpriseDto.description,
          logo: createEnterpriseDto.logo,
          website: createEnterpriseDto.website,
          users: {
            create: {
              userId: userId,
              isOwner: true, // El creador es el OWNER
            },
          },
        },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Enterprise ${enterprise.name} created by owner ${userId}`);
      return enterprise;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una empresa con ese nombre');
      }
      this.logger.error('Error creating enterprise', error);
      throw new HttpException('Error al crear la empresa', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    return this.prisma.enterprise.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        website: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { id },
      include: {
        users: {
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
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return enterprise;
  }

  async update(id: string, updateEnterpriseDto: UpdateEnterpriseDto, userId: string) {
    // Solo el OWNER puede actualizar la empresa
    await this.verifyOwnership(userId, id);

    try {
      return await this.prisma.enterprise.update({
        where: { id },
        data: updateEnterpriseDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe una empresa con ese nombre');
      }
      throw new HttpException('Error al actualizar la empresa', HttpStatus.BAD_REQUEST);
    }
  }

  async remove(id: string, userId: string) {
    // Solo el OWNER puede eliminar la empresa
    await this.verifyOwnership(userId, id);

    // Soft delete
    return this.prisma.enterprise.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== JOIN REQUESTS ====================

  async requestToJoin(joinEnterpriseDto: JoinEnterpriseDto, userId: string) {
    const { enterpriseId } = joinEnterpriseDto;

    const enterprise = await this.prisma.enterprise.findUnique({
      where: { id: enterpriseId, isActive: true },
    });

    if (!enterprise) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const existingMembership = await this.prisma.userEnterprise.findFirst({
      where: { userId },
    });

    if (existingMembership) {
      throw new ConflictException('Ya perteneces a una empresa');
    }

    const existingRequest = await this.prisma.enterpriseJoinRequest.findUnique({
      where: {
        userId_enterpriseId: {
          userId,
          enterpriseId,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === JoinRequestStatus.PENDING) {
        throw new ConflictException('Ya tienes una solicitud pendiente para esta empresa');
      }
      if (existingRequest.status === JoinRequestStatus.REJECTED) {
        return this.prisma.enterpriseJoinRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: JoinRequestStatus.PENDING,
            requestedAt: new Date(),
            processedAt: null,
            processedBy: null,
          },
        });
      }
    }

    const joinRequest = await this.prisma.enterpriseJoinRequest.create({
      data: {
        userId,
        enterpriseId,
      },
      include: {
        enterprise: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`User ${userId} requested to join enterprise ${enterpriseId}`);
    return {
      message: 'Solicitud enviada correctamente',
      request: joinRequest,
    };
  }

  async handleJoinRequest(handleDto: HandleJoinRequestDto, adminUserId: string) {
    const { requestId, action } = handleDto;

    const joinRequest = await this.prisma.enterpriseJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        enterprise: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!joinRequest) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new ConflictException('Esta solicitud ya fue procesada');
    }

    // Solo el OWNER puede manejar solicitudes
    await this.verifyOwnership(adminUserId, joinRequest.enterpriseId);

    if (action === JoinRequestAction.APPROVE) {
      await this.prisma.$transaction([
        this.prisma.enterpriseJoinRequest.update({
          where: { id: requestId },
          data: {
            status: JoinRequestStatus.APPROVED,
            processedAt: new Date(),
            processedBy: adminUserId,
          },
        }),
        this.prisma.userEnterprise.create({
          data: {
            userId: joinRequest.userId,
            enterpriseId: joinRequest.enterpriseId,
            isOwner: false, // Nuevos miembros NO son owners
          },
        }),
      ]);

      this.logger.log(`Join request ${requestId} approved by ${adminUserId}`);
      return { message: 'Solicitud aprobada.  El usuario ha sido agregado a la empresa.' };
    } else {
      await this.prisma.enterpriseJoinRequest.update({
        where: { id: requestId },
        data: {
          status: JoinRequestStatus.REJECTED,
          processedAt: new Date(),
          processedBy: adminUserId,
        },
      });

      this.logger.log(`Join request ${requestId} rejected by ${adminUserId}`);
      return { message: 'Solicitud rechazada.' };
    }
  }

  async getPendingRequests(enterpriseId: string, userId: string) {
    // Solo el OWNER puede ver solicitudes pendientes
    await this.verifyOwnership(userId, enterpriseId);

    return this.prisma.enterpriseJoinRequest.findMany({
      where: {
        enterpriseId,
        status: JoinRequestStatus.PENDING,
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
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  async getMyRequests(userId: string) {
    return this.prisma.enterpriseJoinRequest.findMany({
      where: { userId },
      include: {
        enterprise: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  async cancelJoinRequest(requestId: string, userId: string) {
    const request = await this.prisma.enterpriseJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.userId !== userId) {
      throw new ForbiddenException('No puedes cancelar esta solicitud');
    }

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new ConflictException('Solo puedes cancelar solicitudes pendientes');
    }

    await this.prisma.enterpriseJoinRequest.delete({
      where: { id: requestId },
    });

    return { message: 'Solicitud cancelada' };
  }

  // ==================== USER ENTERPRISE ====================

  async getMyEnterprise(userId: string) {
    const membership = await this.prisma.userEnterprise.findFirst({
      where: { userId },
      include: {
        enterprise: {
          include: {
            users: {
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
            },
            _count: {
              select: { users: true },
            },
          },
        },
      },
    });

    if (!membership) {
      return {
        hasEnterprise: false,
        message: 'No perteneces a ninguna empresa'
      };
    }

    return {
      hasEnterprise: true,
      isOwner: membership.isOwner,
      enterprise: membership.enterprise,
      joinedAt: membership.joinedAt,
    };
  }

  async leaveEnterprise(userId: string) {
    const membership = await this.prisma.userEnterprise.findFirst({
      where: { userId },
    });

    if (!membership) {
      throw new NotFoundException('No perteneces a ninguna empresa');
    }

    // El OWNER no puede salir de la empresa
    if (membership.isOwner) {
      throw new ForbiddenException(
        'El propietario no puede abandonar la empresa.  Transfiere la propiedad primero o elimina la empresa.'
      );
    }

    await this.prisma.userEnterprise.delete({
      where: { id: membership.id },
    });

    return { message: 'Has salido de la empresa correctamente' };
  }

  // ==================== TRANSFER OWNERSHIP ====================

  async transferOwnership(newOwnerId: string, currentOwnerId: string) {
    const currentOwnerMembership = await this.prisma.userEnterprise.findFirst({
      where: {
        userId: currentOwnerId,
        isOwner: true,
      },
    });

    if (!currentOwnerMembership) {
      throw new ForbiddenException('Solo el propietario puede transferir la propiedad');
    }

    const newOwnerMembership = await this.prisma.userEnterprise.findFirst({
      where: {
        userId: newOwnerId,
        enterpriseId: currentOwnerMembership.enterpriseId,
      },
    });

    if (!newOwnerMembership) {
      throw new NotFoundException('El usuario no pertenece a esta empresa');
    }

    await this.prisma.$transaction([
      // Quitar ownership al actual
      this.prisma.userEnterprise.update({
        where: { id: currentOwnerMembership.id },
        data: { isOwner: false },
      }),
      // Dar ownership al nuevo
      this.prisma.userEnterprise.update({
        where: { id: newOwnerMembership.id },
        data: { isOwner: true },
      }),
    ]);

    this.logger.log(`Ownership transferred from ${currentOwnerId} to ${newOwnerId}`);
    return { message: 'Propiedad transferida correctamente' };
  }

  // ==================== REMOVE MEMBER (solo OWNER) ====================

  async removeMember(memberId: string, ownerId: string) {
    await this.verifyOwnership(ownerId);

    const ownerMembership = await this.prisma.userEnterprise.findFirst({
      where: { userId: ownerId },
    });

    const memberMembership = await this.prisma.userEnterprise.findFirst({
      where: {
        userId: memberId,
        enterpriseId: ownerMembership!.enterpriseId,
      },
    });

    if (!memberMembership) {
      throw new NotFoundException('El usuario no pertenece a esta empresa');
    }

    if (memberMembership.isOwner) {
      throw new ForbiddenException('No puedes eliminar al propietario');
    }

    await this.prisma.userEnterprise.delete({
      where: { id: memberMembership.id },
    });

    return { message: 'Miembro eliminado de la empresa' };
  }
}
