import { Test, TestingModule } from '@nestjs/testing';
import { UserRelationshipService } from './user-relationship.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('UserRelationshipService', () => {
  let service: UserRelationshipService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user1',
    email: 'user1@example.com',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      profilePhotoUrl: 'url',
      jobTitle: 'Developer',
    },
  };

  const mockRelationship = {
    id: 'rel1',
    userId: 'user1',
    relatedUserId: 'user2',
    relationshipType: 'CONTACT',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
      userRelationship: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRelationshipService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserRelationshipService>(UserRelationshipService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service['getUserById']('user1');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service['getUserById']('user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('formatUserResponse', () => {
    it('should format user response correctly', () => {
      const result = service['formatUserResponse'](mockUser as any);

      expect(result).toEqual({
        id: 'user1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profilePhotoUrl: 'url',
        jobTitle: 'Developer',
      });
    });
  });

  describe('createRelationship', () => {
    const dto = { relatedUserId: 'user2', relationshipType: 'CONTACT' as any };

    it('should throw BadRequestException if user tries to create relationship with self', async () => {
      await expect(service.createRelationship('user1', { ...dto, relatedUserId: 'user1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if related user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createRelationship('user1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if relationship already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.userRelationship.findFirst.mockResolvedValue(mockRelationship as any);

      await expect(service.createRelationship('user1', dto)).rejects.toThrow(ConflictException);
    });

    it('should create relationship successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.userRelationship.findFirst.mockResolvedValue(null);
      prismaService.userRelationship.create.mockResolvedValue({
        ...mockRelationship,
        relatedUser: mockUser,
      } as any);

      const result = await service.createRelationship('user1', dto);

      expect(result).toEqual({
        message: 'Solicitud de conexión enviada',
        relationship: { ...mockRelationship, relatedUser: mockUser },
      });
    });
  });

  describe('handleRelationshipRequest', () => {
    const dto = { relationshipId: 'rel1', action: 'ACCEPT' as any };

    it('should throw NotFoundException if relationship not found', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(null);

      await expect(service.handleRelationshipRequest('user1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not the recipient', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, relatedUserId: 'user2' } as any);

      await expect(service.handleRelationshipRequest('user3', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if already processed', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, status: 'ACCEPTED' } as any);

      await expect(service.handleRelationshipRequest('user2', dto)).rejects.toThrow(ConflictException);
    });

    it('should accept relationship', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(mockRelationship as any);
      prismaService.userRelationship.update.mockResolvedValue({ ...mockRelationship, status: 'ACCEPTED' } as any);

      const result = await service.handleRelationshipRequest('user2', dto);

      expect(result).toEqual({ message: 'Solicitud aceptada' });
    });

    it('should reject relationship', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(mockRelationship as any);
      prismaService.userRelationship.delete.mockResolvedValue(mockRelationship as any);

      const result = await service.handleRelationshipRequest('user2', { ...dto, action: 'REJECT' as any });

      expect(result).toEqual({ message: 'Solicitud rechazada' });
    });

    it('should block relationship', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(mockRelationship as any);
      prismaService.userRelationship.update.mockResolvedValue({ ...mockRelationship, status: 'BLOCKED' } as any);

      const result = await service.handleRelationshipRequest('user2', { ...dto, action: 'BLOCK' as any });

      expect(result).toEqual({ message: 'Usuario bloqueado' });
    });

    it('should throw BadRequestException for invalid action', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(mockRelationship as any);

      await expect(service.handleRelationshipRequest('user2', { ...dto, action: 'INVALID' as any })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyConnections', () => {
    it('should return formatted connections', async () => {
      const relationships = [
        {
          id: 'rel1',
          userId: 'user1',
          relatedUserId: 'user2',
          relationshipType: 'CONTACT',
          status: 'ACCEPTED',
          updatedAt: new Date(),
          user: mockUser,
          relatedUser: mockUser,
        },
      ];
      prismaService.userRelationship.findMany.mockResolvedValue(relationships as any);

      const result = await service.getMyConnections('user1');

      expect(result).toEqual([
        {
          relationshipId: 'rel1',
          relationshipType: 'CONTACT',
          connectedAt: expect.any(Date),
          user: service['formatUserResponse'](mockUser as any),
        },
      ]);
    });
  });

  describe('getPendingRequestsReceived', () => {
    it('should return pending requests received', async () => {
      const requests = [
        {
          id: 'rel1',
          relationshipType: 'CONTACT',
          createdAt: new Date(),
          user: mockUser,
        },
      ];
      prismaService.userRelationship.findMany.mockResolvedValue(requests as any);

      const result = await service.getPendingRequestsReceived('user1');

      expect(result).toEqual([
        {
          relationshipId: 'rel1',
          relationshipType: 'CONTACT',
          requestedAt: expect.any(Date),
          from: service['formatUserResponse'](mockUser as any),
        },
      ]);
    });
  });

  describe('getPendingRequestsSent', () => {
    it('should return pending requests sent', async () => {
      const requests = [
        {
          id: 'rel1',
          relationshipType: 'CONTACT',
          createdAt: new Date(),
          relatedUser: mockUser,
        },
      ];
      prismaService.userRelationship.findMany.mockResolvedValue(requests as any);

      const result = await service.getPendingRequestsSent('user1');

      expect(result).toEqual([
        {
          relationshipId: 'rel1',
          relationshipType: 'CONTACT',
          requestedAt: expect.any(Date),
          to: service['formatUserResponse'](mockUser as any),
        },
      ]);
    });
  });

  describe('getBlockedUsers', () => {
    it('should return blocked users', async () => {
      const blocked = [
        {
          id: 'rel1',
          updatedAt: new Date(),
          user: mockUser,
          relatedUser: mockUser,
        },
      ];
      prismaService.userRelationship.findMany.mockResolvedValue(blocked as any);

      const result = await service.getBlockedUsers('user1');

      expect(result).toEqual([
        {
          relationshipId: 'rel1',
          blockedAt: expect.any(Date),
          user: service['formatUserResponse'](mockUser as any),
        },
      ]);
    });
  });

  describe('getConnectionsByType', () => {
    it('should return connections by type', async () => {
      const relationships = [
        {
          id: 'rel1',
          updatedAt: new Date(),
          user: mockUser,
          relatedUser: mockUser,
        },
      ];
      prismaService.userRelationship.findMany.mockResolvedValue(relationships as any);

      const result = await service.getConnectionsByType('user1', 'CONTACT');

      expect(result).toEqual([
        {
          relationshipId: 'rel1',
          connectedAt: expect.any(Date),
          user: service['formatUserResponse'](mockUser as any),
        },
      ]);
    });
  });

  describe('updateRelationship', () => {
    const dto = { relationshipType: 'FRIEND' };

    it('should throw NotFoundException if relationship not found', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(null);

      await expect(service.updateRelationship('rel1', 'user1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not part of relationship', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, userId: 'user2', relatedUserId: 'user3' } as any);

      await expect(service.updateRelationship('rel1', 'user1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if not accepted', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, status: 'PENDING' } as any);

      await expect(service.updateRelationship('rel1', 'user1', dto)).rejects.toThrow(ConflictException);
    });

    it('should update relationship', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, status: 'ACCEPTED' } as any);
      prismaService.userRelationship.update.mockResolvedValue(mockRelationship as any);

      const result = await service.updateRelationship('rel1', 'user1', dto);

      expect(result).toEqual(mockRelationship);
    });
  });

  describe('removeConnection', () => {
    it('should throw NotFoundException if relationship not found', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(null);

      await expect(service.removeConnection('rel1', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not part of relationship', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, userId: 'user2', relatedUserId: 'user3' } as any);

      await expect(service.removeConnection('rel1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should remove connection', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(mockRelationship as any);
      prismaService.userRelationship.delete.mockResolvedValue(mockRelationship as any);

      const result = await service.removeConnection('rel1', 'user1');

      expect(result).toEqual({ message: 'Conexión eliminada correctamente' });
    });
  });

  describe('cancelPendingRequest', () => {
    it('should throw NotFoundException if relationship not found', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(null);

      await expect(service.cancelPendingRequest('rel1', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not the sender', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, userId: 'user2' } as any);

      await expect(service.cancelPendingRequest('rel1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if not pending', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, status: 'ACCEPTED' } as any);

      await expect(service.cancelPendingRequest('rel1', 'user1')).rejects.toThrow(ConflictException);
    });

    it('should cancel request', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(mockRelationship as any);
      prismaService.userRelationship.delete.mockResolvedValue(mockRelationship as any);

      const result = await service.cancelPendingRequest('rel1', 'user1');

      expect(result).toEqual({ message: 'Solicitud cancelada' });
    });
  });

  describe('blockUser', () => {
    it('should throw BadRequestException if blocking self', async () => {
      await expect(service.blockUser('user1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.blockUser('user2', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should update existing relationship to blocked', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.userRelationship.findFirst.mockResolvedValue(mockRelationship as any);
      prismaService.userRelationship.update.mockResolvedValue({ ...mockRelationship, status: 'BLOCKED' } as any);

      const result = await service.blockUser('user2', 'user1');

      expect(result).toEqual({ message: 'Usuario bloqueado' });
    });

    it('should create new blocked relationship', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.userRelationship.findFirst.mockResolvedValue(null);
      prismaService.userRelationship.create.mockResolvedValue({ ...mockRelationship, status: 'BLOCKED' } as any);

      const result = await service.blockUser('user2', 'user1');

      expect(result).toEqual({ message: 'Usuario bloqueado' });
    });
  });

  describe('unblockUser', () => {
    it('should throw NotFoundException if relationship not found', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue(null);

      await expect(service.unblockUser('rel1', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if not blocked', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, status: 'ACCEPTED' } as any);

      await expect(service.unblockUser('rel1', 'user1')).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if not the blocker', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, status: 'BLOCKED', userId: 'user2', relatedUserId: 'user3' } as any);

      await expect(service.unblockUser('rel1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should unblock user', async () => {
      prismaService.userRelationship.findUnique.mockResolvedValue({ ...mockRelationship, status: 'BLOCKED' } as any);
      prismaService.userRelationship.delete.mockResolvedValue(mockRelationship as any);

      const result = await service.unblockUser('rel1', 'user1');

      expect(result).toEqual({ message: 'Usuario desbloqueado' });
    });
  });

  describe('getConnectionStats', () => {
    it('should return connection stats', async () => {
      prismaService.userRelationship.count
        .mockResolvedValueOnce(5) // totalConnections
        .mockResolvedValueOnce(2) // pendingReceived
        .mockResolvedValueOnce(1) // pendingSent
        .mockResolvedValueOnce(0); // blockedCount
      prismaService.userRelationship.groupBy.mockResolvedValue([
        { relationshipType: 'CONTACT', _count: 3 },
        { relationshipType: 'FRIEND', _count: 2 },
      ] as any);

      const result = await service.getConnectionStats('user1');

      expect(result).toEqual({
        totalConnections: 5,
        pendingReceived: 2,
        pendingSent: 1,
        blockedCount: 0,
        byType: {
          'CONTACT': 3,
          'FRIEND': 2,
        },
      });
    });
  });

  describe('checkRelationship', () => {
    it('should return no connection if none exists', async () => {
      prismaService.userRelationship.findFirst.mockResolvedValue(null);

      const result = await service.checkRelationship('user1', 'user2');

      expect(result).toEqual({
        isConnected: false,
        status: null,
        relationshipType: null,
      });
    });

    it('should return relationship details', async () => {
      prismaService.userRelationship.findFirst.mockResolvedValue(mockRelationship as any);

      const result = await service.checkRelationship('user1', 'user2');

      expect(result).toEqual({
        isConnected: false,
        status: 'PENDING',
        relationshipType: 'CONTACT',
        relationshipId: 'rel1',
        initiatedByMe: true,
      });
    });
  });
});
