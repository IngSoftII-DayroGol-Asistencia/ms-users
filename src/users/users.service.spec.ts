import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: any;

  const mockUser: User = {
    id: 'user1',
    email: 'test@example.com',
    password: 'hashedpassword',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserProfile: UserProfile = {
    id: 'profile1',
    userId: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    country: 'USA',
    dateOfBirth: new Date('1990-01-01'),
    jobTitle: 'Developer',
    department: 'Engineering',
    bio: 'Test bio',
    profilePhotoUrl: 'https://example.com/photo.jpg',
    profilePhotoKey: 'photo-key',
    emergencyContact: 'Jane Doe',
    emergencyPhone: '+1234567890',
    city: 'New York',
    address: '123 Main St',
    postalCode: '10001',
    phone: '+0987654321',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithRelations = {
    ...mockUser,
    enterprises: [],
    enterprisePermissions: [],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
      userProfile: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('user', () => {
    it('should return user with relations when found', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUserWithRelations);

      const result = await service.user('user1');

      expect(result).toEqual(mockUserWithRelations);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        include: {
          enterprises: {
            include: {
              enterprise: true,
            },
          },
          enterprisePermissions: {
            include: {
              enterprise: true,
              permission: true,
            },
          },
        },
      });
    });

    it('should return null when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.user('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      const error = new Error('Database error');
      prismaService.user.findUnique.mockRejectedValue(error);

      await expect(service.user('user1')).rejects.toThrow('Error finding user');
    });
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      country: 'USA',
      dateOfBirth: '1990-01-01T00:00:00.000Z',
      jobTitle: 'Developer',
      department: 'Engineering',
      bio: 'Test bio',
      profilePhotoUrl: 'https://example.com/photo.jpg',
      profilePhotoKey: 'photo-key',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+1234567890',
      city: 'New York',
      address: '123 Main St',
      postalCode: '10001',
    };

    it('should create user profile with all fields', async () => {
      prismaService.userProfile.create.mockResolvedValue(mockUserProfile);

      const result = await service.createUser(createUserDto, 'user1', '+0987654321');

      expect(result).toEqual(mockUserProfile);
      expect(prismaService.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          country: 'USA',
          dateOfBirth: new Date('1990-01-01'),
          jobTitle: 'Developer',
          department: 'Engineering',
          bio: 'Test bio',
          profilePhotoUrl: 'https://example.com/photo.jpg',
          profilePhotoKey: 'photo-key',
          emergencyContact: 'Jane Doe',
          emergencyPhone: '+1234567890',
          city: 'New York',
          address: '123 Main St',
          postalCode: '10001',
          phone: '+0987654321',
        },
      });
    });

    it('should create user profile with only required fields', async () => {
      const minimalDto = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const minimalProfile = {
        ...mockUserProfile,
        country: null,
        dateOfBirth: null,
        jobTitle: null,
        department: null,
        bio: null,
        profilePhotoUrl: null,
        profilePhotoKey: null,
        emergencyContact: null,
        emergencyPhone: null,
        city: null,
        address: null,
        postalCode: null,
        phone: null,
      };

      prismaService.userProfile.create.mockResolvedValue(minimalProfile);

      const result = await service.createUser(minimalDto, 'user1');

      expect(result).toEqual(minimalProfile);
      expect(prismaService.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          firstName: 'John',
          lastName: 'Doe',
        },
      });
    });

    it('should throw HttpException on database error', async () => {
      const error = new Error('Database error');
      prismaService.userProfile.create.mockRejectedValue(error);

      await expect(service.createUser(createUserDto, 'user1')).rejects.toThrow('Error creating user');
    });
  });

  describe('updateUser', () => {
    const updateParams = {
      where: { id: 'profile1' },
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
    };

    it('should update user profile successfully', async () => {
      const updatedProfile = { ...mockUserProfile, ...updateParams.data };
      prismaService.userProfile.update.mockResolvedValue(updatedProfile);

      const result = await service.updateUser(updateParams);

      expect(result).toEqual(updatedProfile);
      expect(prismaService.userProfile.update).toHaveBeenCalledWith({
        data: updateParams.data,
        where: updateParams.where,
      });
    });

    it('should throw error on database error', async () => {
      const error = new Error('Database error');
      prismaService.userProfile.update.mockRejectedValue(error);

      await expect(service.updateUser(updateParams)).rejects.toThrow('Cannot update');
    });
  });

  describe('deleteUser', () => {
    const deleteWhere = { id: 'profile1' };

    it('should delete user profile successfully', async () => {
      prismaService.userProfile.delete.mockResolvedValue(mockUserProfile);

      const result = await service.deleteUser(deleteWhere);

      expect(result).toEqual(mockUserProfile);
      expect(prismaService.userProfile.delete).toHaveBeenCalledWith({
        where: deleteWhere,
      });
    });

    it('should throw HttpException on database error', async () => {
      const error = new Error('Database error');
      prismaService.userProfile.delete.mockRejectedValue(error);

      await expect(service.deleteUser(deleteWhere)).rejects.toThrow('Cannot delete');
    });
  });
});
