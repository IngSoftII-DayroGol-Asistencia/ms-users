import { Test, TestingModule } from '@nestjs/testing';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JoinRequestAction } from './dto';

describe('EnterpriseController', () => {
  let controller: EnterpriseController;
  let service: any;

  const mockUser = { id: 'user1', email: 'user@example.com' };
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

  const mockJoinRequest = {
    id: 'request1',
    userId: 'user2',
    enterpriseId: 'enterprise1',
    status: 'PENDING',
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
    const mockEnterpriseService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      requestToJoin: jest.fn(),
      handleJoinRequest: jest.fn(),
      getPendingRequests: jest.fn(),
      getMyRequests: jest.fn(),
      cancelJoinRequest: jest.fn(),
      getMyEnterprise: jest.fn(),
      leaveEnterprise: jest.fn(),
      transferOwnership: jest.fn(),
      removeMember: jest.fn(),
    };

    const mockOwnerGuard = {
      canActivate: jest.fn(() => true),
    };

    const mockAccessTokenGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterpriseController],
      providers: [
        {
          provide: EnterpriseService,
          useValue: mockEnterpriseService,
        },
        {
          provide: OwnerGuard,
          useValue: mockOwnerGuard,
        },
        {
          provide: AccessTokenGuard,
          useValue: mockAccessTokenGuard,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<EnterpriseController>(EnterpriseController);
    service = module.get(EnterpriseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'Test Enterprise',
      description: 'Test Description',
      logo: 'https://example.com/logo.png',
      website: 'https://example.com',
    };

    it('should create enterprise successfully', async () => {
      service.create.mockResolvedValue(mockEnterprise);

      const result = await controller.create(createDto, 'user1');

      expect(result).toEqual(mockEnterprise);
      expect(service.create).toHaveBeenCalledWith(createDto, 'user1');
    });
  });

  describe('findAll', () => {
    it('should return all enterprises', async () => {
      const enterprises = [mockEnterprise];
      service.findAll.mockResolvedValue(enterprises);

      const result = await controller.findAll();

      expect(result).toEqual(enterprises);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getMyEnterprise', () => {
    it('should return user enterprise', async () => {
      const enterpriseInfo = {
        hasEnterprise: true,
        isOwner: true,
        enterprise: mockEnterprise,
        joinedAt: new Date(),
      };
      service.getMyEnterprise.mockResolvedValue(enterpriseInfo);

      const result = await controller.getMyEnterprise('user1');

      expect(result).toEqual(enterpriseInfo);
      expect(service.getMyEnterprise).toHaveBeenCalledWith('user1');
    });
  });

  describe('findOne', () => {
    it('should return enterprise by id', async () => {
      service.findOne.mockResolvedValue(mockEnterprise);

      const result = await controller.findOne('enterprise1');

      expect(result).toEqual(mockEnterprise);
      expect(service.findOne).toHaveBeenCalledWith('enterprise1');
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Enterprise',
      description: 'Updated Description',
    };

    it('should update enterprise successfully', async () => {
      service.update.mockResolvedValue({ ...mockEnterprise, ...updateDto });

      const result = await controller.update('enterprise1', updateDto, 'user1');

      expect(result).toEqual({ ...mockEnterprise, ...updateDto });
      expect(service.update).toHaveBeenCalledWith('enterprise1', updateDto, 'user1');
    });
  });

  describe('remove', () => {
    it('should remove enterprise successfully', async () => {
      service.remove.mockResolvedValue({ ...mockEnterprise, isActive: false });

      const result = await controller.remove('enterprise1', 'user1');

      expect(result).toEqual({ ...mockEnterprise, isActive: false });
      expect(service.remove).toHaveBeenCalledWith('enterprise1', 'user1');
    });
  });

  describe('requestToJoin', () => {
    const joinDto = { enterpriseId: 'enterprise1' };

    it('should create join request successfully', async () => {
      const response = {
        message: 'Solicitud enviada correctamente',
        request: mockJoinRequest,
      };
      service.requestToJoin.mockResolvedValue(response);

      const result = await controller.requestToJoin(joinDto, 'user2');

      expect(result).toEqual(response);
      expect(service.requestToJoin).toHaveBeenCalledWith(joinDto, 'user2');
    });
  });

  describe('getMyRequests', () => {
    it('should return user join requests', async () => {
      const requests = [mockJoinRequest];
      service.getMyRequests.mockResolvedValue(requests);

      const result = await controller.getMyRequests('user1');

      expect(result).toEqual(requests);
      expect(service.getMyRequests).toHaveBeenCalledWith('user1');
    });
  });

  describe('cancelJoinRequest', () => {
    it('should cancel join request successfully', async () => {
      const response = { message: 'Solicitud cancelada' };
      service.cancelJoinRequest.mockResolvedValue(response);

      const result = await controller.cancelJoinRequest('request1', 'user2');

      expect(result).toEqual(response);
      expect(service.cancelJoinRequest).toHaveBeenCalledWith('request1', 'user2');
    });
  });

  describe('getPendingRequests', () => {
    it('should return pending requests for enterprise', async () => {
      const requests = [mockJoinRequest];
      service.getPendingRequests.mockResolvedValue(requests);

      const result = await controller.getPendingRequests('enterprise1', 'user1');

      expect(result).toEqual(requests);
      expect(service.getPendingRequests).toHaveBeenCalledWith('enterprise1', 'user1');
    });
  });

  describe('handleJoinRequest', () => {
    const handleDto = { requestId: 'request1', action: JoinRequestAction.APPROVE };

    it('should handle join request successfully', async () => {
      const response = { message: 'Solicitud aprobada. El usuario ha sido agregado a la empresa.' };
      service.handleJoinRequest.mockResolvedValue(response);

      const result = await controller.handleJoinRequest(handleDto, 'user1');

      expect(result).toEqual(response);
      expect(service.handleJoinRequest).toHaveBeenCalledWith(handleDto, 'user1');
    });
  });

  describe('leaveEnterprise', () => {
    it('should allow user to leave enterprise', async () => {
      const response = { message: 'Has salido de la empresa correctamente' };
      service.leaveEnterprise.mockResolvedValue(response);

      const result = await controller.leaveEnterprise('user1');

      expect(result).toEqual(response);
      expect(service.leaveEnterprise).toHaveBeenCalledWith('user1');
    });
  });

  describe('transferOwnership', () => {
    it('should transfer ownership successfully', async () => {
      const response = { message: 'Propiedad transferida correctamente' };
      service.transferOwnership.mockResolvedValue(response);

      const result = await controller.transferOwnership('user2', 'user1');

      expect(result).toEqual(response);
      expect(service.transferOwnership).toHaveBeenCalledWith('user2', 'user1');
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      const response = { message: 'Miembro eliminado de la empresa' };
      service.removeMember.mockResolvedValue(response);

      const result = await controller.removeMember('user2', 'user1');

      expect(result).toEqual(response);
      expect(service.removeMember).toHaveBeenCalledWith('user2', 'user1');
    });
  });
});
