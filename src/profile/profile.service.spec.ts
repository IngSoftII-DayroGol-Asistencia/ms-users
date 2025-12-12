import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

describe('ProfileService', () => {
  let service: ProfileService;
  let prismaService: any;

  const mockProfile = {
    id: 'profile1',
    userId: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    bio: 'Test bio',
    jobTitle: 'Developer',
    phone: '+1234567890',
    country: 'USA',
    city: 'New York',
    address: '123 Main St',
    profilePhotoUrl: 'http://example.com/photo.jpg',
    dateOfBirth: new Date('1990-01-01'),
    experiences: [],
    educations: [],
    skills: [],
    certifications: [],
    languages: [],
    user: {
      id: 'user1',
      email: 'john@example.com',
      phone: '+1234567890',
    },
  };

  const mockExperience = {
    id: 'exp1',
    profileId: 'profile1',
    companyName: 'Test Company',
    jobTitle: 'Developer',
    description: 'Test description',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID',
    startDate: new Date('2020-01-01'),
    endDate: new Date('2023-01-01'),
    isCurrent: false,
    location: 'New York',
    skills: ['JavaScript'],
    achievements: 'Achievement 1',
    profile: mockProfile,
  };

  const mockEducation = {
    id: 'edu1',
    profileId: 'profile1',
    school: 'Test University',
    degree: 'Bachelor',
    fieldOfStudy: 'Computer Science',
    grade: 'A',
    startDate: new Date('2016-01-01'),
    endDate: new Date('2020-01-01'),
    isCurrent: false,
    description: 'Test description',
    skills: ['Programming'],
    profile: mockProfile,
  };

  const mockSkill = {
    id: 'skill1',
    profileId: 'profile1',
    name: 'JavaScript',
    proficiency: 'EXPERT',
    yearsOfExperience: 5,
    endorsements: 0,
    profile: mockProfile,
  };

  const mockCertification = {
    id: 'cert1',
    profileId: 'profile1',
    name: 'AWS Certified',
    issuingOrganization: 'Amazon',
    issueDate: new Date('2022-01-01'),
    expirationDate: new Date('2025-01-01'),
    certificateUrl: 'http://example.com/cert',
    certificateId: 'CERT123',
    description: 'Test certification',
    profile: mockProfile,
  };

  const mockLanguage = {
    id: 'lang1',
    profileId: 'profile1',
    language: 'English',
    proficiency: 'NATIVE',
    profile: mockProfile,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      userProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      experience: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      education: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      skill: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
      },
      certification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      languageProficiency: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyProfile', () => {
    it('should return user profile with all includes', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getMyProfile('user1');

      expect(result).toEqual(mockProfile);
      expect(prismaService.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          experiences: { orderBy: { startDate: 'desc' } },
          educations: { orderBy: { startDate: 'desc' } },
          skills: { orderBy: { yearsOfExperience: 'desc' } },
          certifications: { orderBy: { issueDate: 'desc' } },
          languages: true,
        },
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.getMyProfile('user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfileById', () => {
    it('should return profile by id with user info', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfileById('profile1');

      expect(result).toEqual(mockProfile);
      expect(prismaService.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'profile1' },
        include: {
          experiences: { orderBy: { startDate: 'desc' } },
          educations: { orderBy: { startDate: 'desc' } },
          skills: { orderBy: { yearsOfExperience: 'desc' } },
          certifications: { orderBy: { issueDate: 'desc' } },
          languages: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.getProfileById('profile1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfileByUserId', () => {
    it('should return profile by user id', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfileByUserId('user1', 'requester1');

      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException if profile not found', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.getProfileByUserId('user1', 'requester1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1992-02-02',
    };

    it('should update profile successfully', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.userProfile.update.mockResolvedValue({ ...mockProfile, ...updateDto });

      const result = await service.updateProfile('user1', updateDto);

      expect(result).toEqual({ ...mockProfile, ...updateDto });
      expect(prismaService.userProfile.update).toHaveBeenCalledWith({
        where: { id: mockProfile.id },
        data: {
          ...updateDto,
          dateOfBirth: new Date(updateDto.dateOfBirth),
        },
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile('user1', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createExperience', () => {
    const createDto = {
      companyName: 'Test Company',
      jobTitle: 'Developer',
      description: 'Test description',
      employmentType: 'FULL_TIME' as const,
      experienceLevel: 'MID' as const,
      startDate: '2020-01-01',
      endDate: '2023-01-01',
      isCurrent: false,
      location: 'New York',
      skills: ['JavaScript'],
      achievements: 'Achievement 1',
    };

    it('should create experience successfully', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.experience.create.mockResolvedValue(mockExperience);

      const result = await service.createExperience('user1', createDto);

      expect(result).toEqual(mockExperience);
    });

    it('should throw NotFoundException if profile not found', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.createExperience('user1', createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getExperiences', () => {
    it('should return user experiences', async () => {
      const experiences = [mockExperience];
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.experience.findMany.mockResolvedValue(experiences);

      const result = await service.getExperiences('user1');

      expect(result).toEqual(experiences);
    });
  });

  describe('getExperienceById', () => {
    it('should return experience by id', async () => {
      prismaService.experience.findUnique.mockResolvedValue(mockExperience);

      const result = await service.getExperienceById('exp1', 'user1');

      expect(result).toEqual(mockExperience);
    });

    it('should throw NotFoundException if experience not found', async () => {
      prismaService.experience.findUnique.mockResolvedValue(null);

      await expect(service.getExperienceById('exp1', 'user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateExperience', () => {
    const updateDto = {
      jobTitle: 'Senior Developer',
      endDate: '2023-06-01',
    };

    it('should update experience successfully', async () => {
      prismaService.experience.findUnique.mockResolvedValue(mockExperience);
      prismaService.experience.update.mockResolvedValue({ ...mockExperience, ...updateDto });

      const result = await service.updateExperience('exp1', 'user1', updateDto);

      expect(result).toEqual({ ...mockExperience, ...updateDto });
    });

    it('should throw NotFoundException if experience not found', async () => {
      prismaService.experience.findUnique.mockResolvedValue(null);

      await expect(service.updateExperience('exp1', 'user1', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own experience', async () => {
      const experienceWithDifferentUser = { ...mockExperience, profile: { ...mockProfile, userId: 'user2' } };
      prismaService.experience.findUnique.mockResolvedValue(experienceWithDifferentUser);

      await expect(service.updateExperience('exp1', 'user1', updateDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteExperience', () => {
    it('should delete experience successfully', async () => {
      prismaService.experience.findUnique.mockResolvedValue(mockExperience);
      prismaService.experience.delete.mockResolvedValue(mockExperience);

      const result = await service.deleteExperience('exp1', 'user1');

      expect(result).toEqual({ message: 'Experiencia eliminada correctamente' });
    });

    it('should throw NotFoundException if experience not found', async () => {
      prismaService.experience.findUnique.mockResolvedValue(null);

      await expect(service.deleteExperience('exp1', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own experience', async () => {
      const experienceWithDifferentUser = { ...mockExperience, profile: { ...mockProfile, userId: 'user2' } };
      prismaService.experience.findUnique.mockResolvedValue(experienceWithDifferentUser);

      await expect(service.deleteExperience('exp1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createEducation', () => {
    const createDto = {
      school: 'Test University',
      degree: 'Bachelor',
      fieldOfStudy: 'Computer Science',
      grade: 'A',
      startDate: '2016-01-01',
      endDate: '2020-01-01',
      isCurrent: false,
      description: 'Test description',
      skills: ['Programming'],
    };

    it('should create education successfully', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.education.create.mockResolvedValue(mockEducation);

      const result = await service.createEducation('user1', createDto);

      expect(result).toEqual(mockEducation);
    });
  });

  describe('getEducations', () => {
    it('should return user educations', async () => {
      const educations = [mockEducation];
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.education.findMany.mockResolvedValue(educations);

      const result = await service.getEducations('user1');

      expect(result).toEqual(educations);
    });
  });

  describe('updateEducation', () => {
    const updateDto = {
      degree: 'Master',
      endDate: '2021-01-01',
    };

    it('should update education successfully', async () => {
      prismaService.education.findUnique.mockResolvedValue(mockEducation);
      prismaService.education.update.mockResolvedValue({ ...mockEducation, ...updateDto });

      const result = await service.updateEducation('edu1', 'user1', updateDto);

      expect(result).toEqual({ ...mockEducation, ...updateDto });
    });

    it('should throw ForbiddenException if user does not own education', async () => {
      const educationWithDifferentUser = { ...mockEducation, profile: { ...mockProfile, userId: 'user2' } };
      prismaService.education.findUnique.mockResolvedValue(educationWithDifferentUser);

      await expect(service.updateEducation('edu1', 'user1', updateDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteEducation', () => {
    it('should delete education successfully', async () => {
      prismaService.education.findUnique.mockResolvedValue(mockEducation);
      prismaService.education.delete.mockResolvedValue(mockEducation);

      const result = await service.deleteEducation('edu1', 'user1');

      expect(result).toEqual({ message: 'Educación eliminada correctamente' });
    });
  });

  describe('createSkill', () => {
    const createDto = {
      name: 'JavaScript',
      proficiency: 'EXPERT' as const,
      yearsOfExperience: 5,
    };

    it('should create skill successfully', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.skill.findUnique.mockResolvedValue(null);
      prismaService.skill.create.mockResolvedValue(mockSkill);

      const result = await service.createSkill('user1', createDto);

      expect(result).toEqual(mockSkill);
    });

    it('should throw ConflictException if skill already exists', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.skill.findUnique.mockResolvedValue(mockSkill);

      await expect(service.createSkill('user1', createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getSkills', () => {
    it('should return user skills', async () => {
      const skills = [mockSkill];
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.skill.findMany.mockResolvedValue(skills);

      const result = await service.getSkills('user1');

      expect(result).toEqual(skills);
    });
  });

  describe('updateSkill', () => {
    const updateDto = {
      proficiency: 'ADVANCED' as const,
      yearsOfExperience: 6,
    };

    it('should update skill successfully', async () => {
      prismaService.skill.findUnique.mockResolvedValue(mockSkill);
      prismaService.skill.update.mockResolvedValue({ ...mockSkill, ...updateDto });

      const result = await service.updateSkill('skill1', 'user1', updateDto);

      expect(result).toEqual({ ...mockSkill, ...updateDto });
    });

    it('should throw ForbiddenException if user does not own skill', async () => {
      const skillWithDifferentUser = { ...mockSkill, profile: { ...mockProfile, userId: 'user2' } };
      prismaService.skill.findUnique.mockResolvedValue(skillWithDifferentUser);

      await expect(service.updateSkill('skill1', 'user1', updateDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteSkill', () => {
    it('should delete skill successfully', async () => {
      prismaService.skill.findUnique.mockResolvedValue(mockSkill);
      prismaService.skill.delete.mockResolvedValue(mockSkill);

      const result = await service.deleteSkill('skill1', 'user1');

      expect(result).toEqual({ message: 'Habilidad eliminada correctamente' });
    });
  });

  describe('endorseSkill', () => {
    it('should endorse skill successfully', async () => {
      const skillWithDifferentUser = { ...mockSkill, profile: { ...mockProfile, userId: 'user2' } };
      prismaService.skill.findUnique.mockResolvedValue(skillWithDifferentUser);
      prismaService.skill.update.mockResolvedValue({ ...skillWithDifferentUser, endorsements: 1 });

      const result = await service.endorseSkill('skill1', 'user1');

      expect(result.endorsements).toBe(1);
    });

    it('should throw ForbiddenException if user tries to endorse own skill', async () => {
      prismaService.skill.findUnique.mockResolvedValue(mockSkill);

      await expect(service.endorseSkill('skill1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createCertification', () => {
    const createDto = {
      name: 'AWS Certified',
      issuingOrganization: 'Amazon',
      issueDate: '2022-01-01',
      expirationDate: '2025-01-01',
      certificateUrl: 'http://example.com/cert',
      certificateId: 'CERT123',
      description: 'Test certification',
    };

    it('should create certification successfully', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.certification.create.mockResolvedValue(mockCertification);

      const result = await service.createCertification('user1', createDto);

      expect(result).toEqual(mockCertification);
    });
  });

  describe('getCertifications', () => {
    it('should return user certifications', async () => {
      const certifications = [mockCertification];
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.certification.findMany.mockResolvedValue(certifications);

      const result = await service.getCertifications('user1');

      expect(result).toEqual(certifications);
    });
  });

  describe('updateCertification', () => {
    const updateDto = {
      name: 'AWS Advanced Certified',
      expirationDate: '2026-01-01',
    };

    it('should update certification successfully', async () => {
      prismaService.certification.findUnique.mockResolvedValue(mockCertification);
      prismaService.certification.update.mockResolvedValue({ ...mockCertification, ...updateDto });

      const result = await service.updateCertification('cert1', 'user1', updateDto);

      expect(result).toEqual({ ...mockCertification, ...updateDto });
    });

    it('should throw ForbiddenException if user does not own certification', async () => {
      const certificationWithDifferentUser = { ...mockCertification, profile: { ...mockProfile, userId: 'user2' } };
      prismaService.certification.findUnique.mockResolvedValue(certificationWithDifferentUser);

      await expect(service.updateCertification('cert1', 'user1', updateDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteCertification', () => {
    it('should delete certification successfully', async () => {
      prismaService.certification.findUnique.mockResolvedValue(mockCertification);
      prismaService.certification.delete.mockResolvedValue(mockCertification);

      const result = await service.deleteCertification('cert1', 'user1');

      expect(result).toEqual({ message: 'Certificación eliminada correctamente' });
    });
  });

  describe('createLanguage', () => {
    const createDto = {
      language: 'English',
      proficiency: 'NATIVE' as const,
    };

    it('should create language successfully', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.languageProficiency.findUnique.mockResolvedValue(null);
      prismaService.languageProficiency.create.mockResolvedValue(mockLanguage);

      const result = await service.createLanguage('user1', createDto);

      expect(result).toEqual(mockLanguage);
    });

    it('should throw ConflictException if language already exists', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.languageProficiency.findUnique.mockResolvedValue(mockLanguage);

      await expect(service.createLanguage('user1', createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getLanguages', () => {
    it('should return user languages', async () => {
      const languages = [mockLanguage];
      prismaService.userProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.languageProficiency.findMany.mockResolvedValue(languages);

      const result = await service.getLanguages('user1');

      expect(result).toEqual(languages);
    });
  });

  describe('updateLanguage', () => {
    const updateDto = {
      proficiency: 'FLUENT' as const,
    };

    it('should update language successfully', async () => {
      prismaService.languageProficiency.findUnique.mockResolvedValue(mockLanguage);
      prismaService.languageProficiency.update.mockResolvedValue({ ...mockLanguage, ...updateDto });

      const result = await service.updateLanguage('lang1', 'user1', updateDto);

      expect(result).toEqual({ ...mockLanguage, ...updateDto });
    });

    it('should throw ForbiddenException if user does not own language', async () => {
      const languageWithDifferentUser = { ...mockLanguage, profile: { ...mockProfile, userId: 'user2' } };
      prismaService.languageProficiency.findUnique.mockResolvedValue(languageWithDifferentUser);

      await expect(service.updateLanguage('lang1', 'user1', updateDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteLanguage', () => {
    it('should delete language successfully', async () => {
      prismaService.languageProficiency.findUnique.mockResolvedValue(mockLanguage);
      prismaService.languageProficiency.delete.mockResolvedValue(mockLanguage);

      const result = await service.deleteLanguage('lang1', 'user1');

      expect(result).toEqual({ message: 'Idioma eliminado correctamente' });
    });
  });

  describe('getFullCV', () => {
    it('should return complete CV data', async () => {
      const fullProfile = {
        ...mockProfile,
        user: {
          id: 'user1',
          email: 'john@example.com',
          phone: '+1234567890',
        },
        experiences: [mockExperience],
        educations: [mockEducation],
        skills: [mockSkill],
        certifications: [mockCertification],
        languages: [mockLanguage],
      };

      prismaService.userProfile.findUnique.mockResolvedValue(fullProfile);

      const result = await service.getFullCV('user1');

      expect(result).toHaveProperty('personalInfo');
      expect(result).toHaveProperty('experiences');
      expect(result).toHaveProperty('educations');
      expect(result).toHaveProperty('skills');
      expect(result).toHaveProperty('certifications');
      expect(result).toHaveProperty('languages');
    });

    it('should throw NotFoundException if profile not found', async () => {
      prismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.getFullCV('user1')).rejects.toThrow(NotFoundException);
    });
  });
});
