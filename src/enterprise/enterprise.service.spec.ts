import { Test, TestingModule } from '@nestjs/testing';
import { EnterpriseService } from './enterprise.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JoinRequestAction } from './dto';

// Define JoinRequestStatus enum since it's not exported from @prisma/client
enum JoinRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

describe('EnterpriseService', () => {
  let service: EnterpriseService;
  let prismaService: any;

  const mockUser = {
    id: 'user1',
    email: 'user@example.com',
  };

  const mockEnterprise = {
    id: 'enterprise1',
    name: 'Test Enterprise',
    description: 'Test Description',
    logo: 'https://example.com/logo.png',
    website: 'https://example.com',
    isActive: true,
    createdAt: new Date(),
    users: [],
    _count: { users: 1 },
  };

  const mockMembership = {
    id: 'membership1',
    userId: 'user1',
    enterpriseId: 'enterprise1',
    isOwner: true,
    joinedAt: new Date(),
    enterprise: mockEnterprise,
  };

  const mockJoinRequest = {
    id: 'request1',
    userId: 'user2',
    enterpriseId: 'enterprise1',
    status: JoinRequestStatus.PENDING,
    requestedAt: new Date(),
    processedAt: null,
    processedBy: null,
    enterprise: {
      id: 'enterprise1',
      name: 'Test Enterprise',
    },
    user: mockUser,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      enterprise: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userEnterprise: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      enterpriseJoinRequest: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterpriseService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EnterpriseService>(EnterpriseService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'Test Enterprise',
      description: 'Test Description',
      logo: 'https://example.com/logo.png',
      website: 'https://example.com',
    };

    it('should create enterprise successfully', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);
      prismaService.enterprise.create.mockResolvedValue(mockEnterprise);

      const result = await service.create(createDto, 'user1');

      expect(result).toEqual(mockEnterprise);
      expect(prismaService.enterprise.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          description: createDto.description,
          logo: createDto.logo,
          website: createDto.website,
          users: {
            create: {
              userId: 'user1',
              isOwner: true,
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
    });

    it('should throw ConflictException if user already belongs to enterprise', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);

      await expect(service.create(createDto, 'user1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if enterprise name already exists', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);
      const error = { code: 'P2002' };
      prismaService.enterprise.create.mockRejectedValue(error);

      await expect(service.create(createDto, 'user1')).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all active enterprises', async () => {
      const enterprises = [mockEnterprise];
      prismaService.enterprise.findMany.mockResolvedValue(enterprises);

      const result = await service.findAll();

      expect(result).toEqual(enterprises);
      expect(prismaService.enterprise.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('findOne', () => {
    it('should return enterprise by id', async () => {
      prismaService.enterprise.findUnique.mockResolvedValue(mockEnterprise);

      const result = await service.findOne('enterprise1');

      expect(result).toEqual(mockEnterprise);
    });

    it('should throw NotFoundException if enterprise not found', async () => {
      prismaService.enterprise.findUnique.mockResolvedValue(null);

      await expect(service.findOne('enterprise1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Enterprise',
      description: 'Updated Description',
    };

    it('should update enterprise successfully', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.enterprise.update.mockResolvedValue({ ...mockEnterprise, ...updateDto });

      const result = await service.update('enterprise1', updateDto, 'user1');

      expect(result).toEqual({ ...mockEnterprise, ...updateDto });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect(service.update('enterprise1', updateDto, 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if name already exists', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      const error = { code: 'P2002' };
      prismaService.enterprise.update.mockRejectedValue(error);

      await expect(service.update('enterprise1', updateDto, 'user1')).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete enterprise successfully', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.enterprise.update.mockResolvedValue({ ...mockEnterprise, isActive: false });

      const result = await service.remove('enterprise1', 'user1');

      expect(result).toEqual({ ...mockEnterprise, isActive: false });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect(service.remove('enterprise1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('requestToJoin', () => {
    const joinDto = { enterpriseId: 'enterprise1' };

    it('should create join request successfully', async () => {
      prismaService.enterprise.findUnique.mockResolvedValue(mockEnterprise);
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);
      prismaService.enterpriseJoinRequest.findUnique.mockResolvedValue(null);
      prismaService.enterpriseJoinRequest.create.mockResolvedValue(mockJoinRequest);

      const result = await service.requestToJoin(joinDto, 'user2');

      expect(result).toEqual({
        message: 'Solicitud enviada correctamente',
        request: mockJoinRequest,
      });
    });

    it('should throw NotFoundException if enterprise not found', async () => {
      prismaService.enterprise.findUnique.mockResolvedValue(null);

      await expect(service.requestToJoin(joinDto, 'user2')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already belongs to enterprise', async () => {
      prismaService.enterprise.findUnique.mockResolvedValue(mockEnterprise);
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);

      await expect(service.requestToJoin(joinDto, 'user2')).rejects.toThrow(ConflictException);
    });

    it('should reactivate rejected request', async () => {
      const rejectedRequest = { ...mockJoinRequest, status: JoinRequestStatus.REJECTED };
      prismaService.enterprise.findUnique.mockResolvedValue(mockEnterprise);
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);
      prismaService.enterpriseJoinRequest.findUnique.mockResolvedValue(rejectedRequest);
      prismaService.enterpriseJoinRequest.update.mockResolvedValue({ ...rejectedRequest, status: JoinRequestStatus.PENDING });

      const result = await service.requestToJoin(joinDto, 'user2');

      expect(result).toEqual({ ...rejectedRequest, status: JoinRequestStatus.PENDING });
    });
  });

  describe('handleJoinRequest', () => {
    const handleDto = { requestId: 'request1', action: JoinRequestAction.APPROVE };

    it('should approve join request successfully', async () => {
      prismaService.enterpriseJoinRequest.findUnique.mockResolvedValue(mockJoinRequest);
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.$transaction.mockResolvedValue([]);

      const result = await service.handleJoinRequest(handleDto, 'user1');

      expect(result).toEqual({ message: 'Solicitud aprobada.  El usuario ha sido agregado a la empresa.' });
    });

    it('should reject join request successfully', async () => {
      const rejectDto = { ...handleDto, action: JoinRequestAction.REJECT };
      prismaService.enterpriseJoinRequest.findUnique.mockResolvedValue(mockJoinRequest);
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.enterpriseJoinRequest.update.mockResolvedValue({ ...mockJoinRequest, status: JoinRequestStatus.REJECTED });

      const result = await service.handleJoinRequest(rejectDto, 'user1');

      expect(result).toEqual({ message: 'Solicitud rechazada.' });
    });

    it('should throw NotFoundException if request not found', async () => {
      prismaService.enterpriseJoinRequest.findUnique.mockResolvedValue(null);

      await expect(service.handleJoinRequest(handleDto, 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prismaService.enterpriseJoinRequest.findUnique.mockResolvedValue(mockJoinRequest);
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect(service.handleJoinRequest(handleDto, 'user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPendingRequests', () => {
    it('should return pending requests for owner', async () => {
      const requests = [mockJoinRequest];
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);
      prismaService.enterpriseJoinRequest.findMany.mockResolvedValue(requests);

      const result = await service.getPendingRequests('enterprise1', 'user1');

      expect(result).toEqual(requests);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect(service.getPendingRequests('enterprise1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyRequests', () => {
    it('should return user join requests', async () => {
      const requests = [mockJoinRequest];
      prismaService.enterpriseJoinRequest.findMany.mockResolvedValue(requests);

      const result = await service.getMyRequests('user1');

      expect(result).toEqual(requests);
    });
  });

  describe('cancelJoinRequest', () => {
    it('should cancel pending request successfully', async () => {
      prismaService.enterpriseJoinRequest.findUnique.mockResolvedValue(mockJoinRequest);
      prismaService.enterpriseJoinRequest.delete.mockResolvedValue(mockJoinRequest);

      const result = await service.cancelJoinRequest('request1', 'user2');

      expect(result).toEqual({ message: 'Solicitud cancelada' });
    });

    it('should throw NotFoundException if request not found', async () => {
      prismaService.enterpriseJoinRequest.findUnique.mockResolvedValue(null);

      await expect(service.cancelJoinRequest('request1', 'user2')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own request', async () => {
      prismaService.enterpriseJoinRequest.findUnique.mockResolvedValue(mockJoinRequest);

      await expect(service.cancelJoinRequest('request1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyEnterprise', () => {
    it('should return user enterprise info', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);

      const result = await service.getMyEnterprise('user1');

      expect(result).toEqual({
        hasEnterprise: true,
        isOwner: true,
        enterprise: mockEnterprise,
        joinedAt: mockMembership.joinedAt,
      });
    });

    it('should return no enterprise message if user has no membership', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      const result = await service.getMyEnterprise('user1');

      expect(result).toEqual({
        hasEnterprise: false,
        message: 'No perteneces a ninguna empresa'
      });
    });
  });

  describe('leaveEnterprise', () => {
    it('should allow member to leave enterprise', async () => {
      const memberMembership = { ...mockMembership, isOwner: false };
      prismaService.userEnterprise.findFirst.mockResolvedValue(memberMembership);
      prismaService.userEnterprise.delete.mockResolvedValue(memberMembership);

      const result = await service.leaveEnterprise('user1');

      expect(result).toEqual({ message: 'Has salido de la empresa correctamente' });
    });

    it('should throw ForbiddenException if owner tries to leave', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(mockMembership);

      await expect(service.leaveEnterprise('user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user has no membership', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect(service.leaveEnterprise('user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('transferOwnership', () => {
    it('should transfer ownership successfully', async () => {
      const newOwnerMembership = { ...mockMembership, userId: 'user2', isOwner: false };
      prismaService.userEnterprise.findFirst
        .mockResolvedValueOnce(mockMembership) // current owner
        .mockResolvedValueOnce(newOwnerMembership); // new owner
      prismaService.$transaction.mockResolvedValue([]);

      const result = await service.transferOwnership('user2', 'user1');

      expect(result).toEqual({ message: 'Propiedad transferida correctamente' });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect(service.transferOwnership('user2', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if new owner not in enterprise', async () => {
      prismaService.userEnterprise.findFirst
        .mockResolvedValueOnce(mockMembership) // current owner
        .mockResolvedValueOnce(null); // new owner not found

      await expect(service.transferOwnership('user2', 'user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      const memberMembership = { ...mockMembership, userId: 'user2', isOwner: false };
      prismaService.userEnterprise.findFirst
        .mockResolvedValueOnce(mockMembership) // owner
        .mockResolvedValueOnce(memberMembership); // member
      prismaService.userEnterprise.delete.mockResolvedValue(memberMembership);

      const result = await service.removeMember('user2', 'user1');

      expect(result).toEqual({ message: 'Miembro eliminado de la empresa' });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prismaService.userEnterprise.findFirst.mockResolvedValue(null);

      await expect(service.removeMember('user2', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if trying to remove owner', async () => {
      prismaService.userEnterprise.findFirst
        .mockResolvedValueOnce(mockMembership) // owner
        .mockResolvedValueOnce(mockMembership); // trying to remove owner (same membership)

      await expect(service.removeMember('user1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });
});
