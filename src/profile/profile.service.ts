import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateProfileDto,
  CreateExperienceDto,
  UpdateExperienceDto,
  CreateEducationDto,
  UpdateEducationDto,
  CreateSkillDto,
  UpdateSkillDto,
  CreateCertificationDto,
  UpdateCertificationDto,
  CreateLanguageDto,
  UpdateLanguageDto,
} from './dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly prisma: PrismaService) { }

  // ==================== HELPERS ====================

  private async getProfileByUserIdd(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return profile;
  }

  private async verifyOwnership(resourceUserId: string, currentUserId: string) {
    if (resourceUserId !== currentUserId) {
      throw new ForbiddenException('No tienes permisos para modificar este recurso');
    }
  }

  // ==================== PROFILE ====================

  async getMyProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        experiences: {
          orderBy: { startDate: 'desc' },
        },
        educations: {
          orderBy: { startDate: 'desc' },
        },
        skills: {
          orderBy: { yearsOfExperience: 'desc' },
        },
        certifications: {
          orderBy: { issueDate: 'desc' },
        },
        languages: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return profile;
  }

  async getProfileById(profileId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: profileId },
      include: {
        experiences: {
          orderBy: { startDate: 'desc' },
        },
        educations: {
          orderBy: { startDate: 'desc' },
        },
        skills: {
          orderBy: { yearsOfExperience: 'desc' },
        },
        certifications: {
          orderBy: { issueDate: 'desc' },
        },
        languages: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return profile;
  }

  async getProfileByUserId(userId: string, requesterId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        experiences: {
          orderBy: { startDate: 'desc' },
        },
        educations: {
          orderBy: { startDate: 'desc' },
        },
        skills: {
          orderBy: { yearsOfExperience: 'desc' },
        },
        certifications: {
          orderBy: { issueDate: 'desc' },
        },
        languages: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const profile = await this.getProfileByUserIdd(userId);
    this.logger.log(profile)
    const {
      experiences,
      educations,
      skills,
      languages,
      certifications,
      ...flatData
    } = updateProfileDto;
    return this.prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        ...flatData,

        ...(flatData.dateOfBirth && {
          dateOfBirth: new Date(flatData.dateOfBirth),
        }),

        ...(experiences && {
          experiences: {
            deleteMany: {},
            create: experiences.map((exp) => ({
              companyName: exp.companyName,
              jobTitle: exp.jobTitle,
              description: exp.description,
              employmentType: exp.employmentType,
              experienceLevel: exp.experienceLevel,
              startDate: new Date(exp.startDate),
              endDate: exp.endDate ? new Date(exp.endDate) : null,
              isCurrent: exp.isCurrent,
              location: exp.location,
              skills: exp.skills,
              achievements: exp.achievements
            })),
          },
        }),

        ...(educations && {
          educations: {
            deleteMany: {},
            create: educations.map((edu) => ({
              school: edu.school,
              degree: edu.degree,
              fieldOfStudy: edu.fieldOfStudy,
              grade: edu.grade,
              startDate: new Date(edu.startDate),
              endDate: edu.endDate ? new Date(edu.endDate) : null,
              isCurrent: edu.isCurrent,
              description: edu.description,
              skills: edu.skills
            })),
          },
        }),

        ...(skills && {
          skills: {
            deleteMany: {},
            create: skills.map((skill) => ({
              name: skill.name,
              proficiency: skill.proficiency, // Es un Enum, pasa directo
              yearsOfExperience: skill.yearsOfExperience
            })),
          },
        }),

        ...(languages && {
          languages: {
            deleteMany: {},
            create: languages.map((lang) => ({
              language: lang.language,
              proficiency: lang.proficiency, // Es String según tu schema
            })),
          },
        }),

        ...(certifications && {
          certifications: {
            deleteMany: {},
            create: certifications.map((cert) => ({
              name: cert.name,
              issuingOrganization: cert.issuingOrganization,
              issueDate: new Date(cert.issueDate),
              expirationDate: cert.expirationDate ? new Date(cert.expirationDate) : null,
              certificateUrl: cert.certificateUrl,
              certificateId: cert.certificateId,
              description: cert.description
            })),
          },
        }),
      },
    });
  }

  // ==================== EXPERIENCE ====================

  async createExperience(userId: string, dto: CreateExperienceDto) {
    const profile = await this.getProfileByUserIdd(userId);

    return this.prisma.experience.create({
      data: {
        profileId: profile.id,
        companyName: dto.companyName,
        jobTitle: dto.jobTitle,
        description: dto.description,
        employmentType: dto.employmentType,
        experienceLevel: dto.experienceLevel,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent ?? false,
        location: dto.location,
        skills: dto.skills ?? [],
        achievements: dto.achievements,
      },
    });
  }

  async getExperiences(userId: string) {
    const profile = await this.getProfileByUserIdd(userId);

    return this.prisma.experience.findMany({
      where: { profileId: profile.id },
      orderBy: { startDate: 'desc' },
    });
  }

  async getExperienceById(id: string, userId: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!experience) {
      throw new NotFoundException('Experiencia no encontrada');
    }

    return experience;
  }

  async updateExperience(id: string, userId: string, dto: UpdateExperienceDto) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!experience) {
      throw new NotFoundException('Experiencia no encontrada');
    }

    await this.verifyOwnership(experience.profile.userId, userId);

    return this.prisma.experience.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      },
    });
  }

  async deleteExperience(id: string, userId: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!experience) {
      throw new NotFoundException('Experiencia no encontrada');
    }

    await this.verifyOwnership(experience.profile.userId, userId);

    await this.prisma.experience.delete({ where: { id } });

    return { message: 'Experiencia eliminada correctamente' };
  }

  // ==================== EDUCATION ====================

  async createEducation(userId: string, dto: CreateEducationDto) {
    const profile = await this.getProfileByUserIdd(userId);

    return this.prisma.education.create({
      data: {
        profileId: profile.id,
        school: dto.school,
        degree: dto.degree,
        fieldOfStudy: dto.fieldOfStudy,
        grade: dto.grade,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent ?? false,
        description: dto.description,
        skills: dto.skills ?? [],
      },
    });
  }

  async getEducations(userId: string) {
    const profile = await this.getProfileByUserIdd(userId);

    return this.prisma.education.findMany({
      where: { profileId: profile.id },
      orderBy: { startDate: 'desc' },
    });
  }

  async getEducationById(id: string, userId: string) {
    const education = await this.prisma.education.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!education) {
      throw new NotFoundException('Educación no encontrada');
    }

    return education;
  }

  async updateEducation(id: string, userId: string, dto: UpdateEducationDto) {
    const education = await this.prisma.education.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!education) {
      throw new NotFoundException('Educación no encontrada');
    }

    await this.verifyOwnership(education.profile.userId, userId);

    return this.prisma.education.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      },
    });
  }

  async deleteEducation(id: string, userId: string) {
    const education = await this.prisma.education.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!education) {
      throw new NotFoundException('Educación no encontrada');
    }

    await this.verifyOwnership(education.profile.userId, userId);

    await this.prisma.education.delete({ where: { id } });

    return { message: 'Educación eliminada correctamente' };
  }

  // ==================== SKILLS ====================

  async createSkill(userId: string, dto: CreateSkillDto) {
    const profile = await this.getProfileByUserIdd(userId);

    // Verificar si ya existe la skill
    const existingSkill = await this.prisma.skill.findUnique({
      where: {
        profileId_name: {
          profileId: profile.id,
          name: dto.name,
        },
      },
    });

    if (existingSkill) {
      throw new ConflictException('Ya tienes esta habilidad registrada');
    }

    return this.prisma.skill.create({
      data: {
        profileId: profile.id,
        name: dto.name,
        proficiency: dto.proficiency,
        yearsOfExperience: dto.yearsOfExperience,
      },
    });
  }

  async getSkills(userId: string) {
    const profile = await this.getProfileByUserIdd(userId);

    return this.prisma.skill.findMany({
      where: { profileId: profile.id },
      orderBy: { yearsOfExperience: 'desc' },
    });
  }

  async updateSkill(id: string, userId: string, dto: UpdateSkillDto) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!skill) {
      throw new NotFoundException('Habilidad no encontrada');
    }

    await this.verifyOwnership(skill.profile.userId, userId);

    return this.prisma.skill.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSkill(id: string, userId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!skill) {
      throw new NotFoundException('Habilidad no encontrada');
    }

    await this.verifyOwnership(skill.profile.userId, userId);

    await this.prisma.skill.delete({ where: { id } });

    return { message: 'Habilidad eliminada correctamente' };
  }

  async endorseSkill(skillId: string, userId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
      include: { profile: true },
    });

    if (!skill) {
      throw new NotFoundException('Habilidad no encontrada');
    }

    // No puedes endorsar tus propias habilidades
    if (skill.profile.userId === userId) {
      throw new ForbiddenException('No puedes recomendar tus propias habilidades');
    }

    return this.prisma.skill.update({
      where: { id: skillId },
      data: {
        endorsements: { increment: 1 },
      },
    });
  }

  // ==================== CERTIFICATIONS ====================

  async createCertification(userId: string, dto: CreateCertificationDto) {
    const profile = await this.getProfileByUserIdd(userId);

    return this.prisma.certification.create({
      data: {
        profileId: profile.id,
        name: dto.name,
        issuingOrganization: dto.issuingOrganization,
        issueDate: new Date(dto.issueDate),
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        certificateUrl: dto.certificateUrl,
        certificateId: dto.certificateId,
        description: dto.description,
      },
    });
  }

  async getCertifications(userId: string) {
    const profile = await this.getProfileByUserIdd(userId);

    return this.prisma.certification.findMany({
      where: { profileId: profile.id },
      orderBy: { issueDate: 'desc' },
    });
  }

  async getCertificationById(id: string, userId: string) {
    const certification = await this.prisma.certification.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!certification) {
      throw new NotFoundException('Certificación no encontrada');
    }

    return certification;
  }

  async updateCertification(id: string, userId: string, dto: UpdateCertificationDto) {
    const certification = await this.prisma.certification.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!certification) {
      throw new NotFoundException('Certificación no encontrada');
    }

    await this.verifyOwnership(certification.profile.userId, userId);

    return this.prisma.certification.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.issueDate && { issueDate: new Date(dto.issueDate) }),
        ...(dto.expirationDate && { expirationDate: new Date(dto.expirationDate) }),
      },
    });
  }

  async deleteCertification(id: string, userId: string) {
    const certification = await this.prisma.certification.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!certification) {
      throw new NotFoundException('Certificación no encontrada');
    }

    await this.verifyOwnership(certification.profile.userId, userId);

    await this.prisma.certification.delete({ where: { id } });

    return { message: 'Certificación eliminada correctamente' };
  }

  // ==================== LANGUAGES ====================

  async createLanguage(userId: string, dto: CreateLanguageDto) {
    const profile = await this.getProfileByUserIdd(userId);

    // Verificar si ya existe el idioma
    const existingLanguage = await this.prisma.languageProficiency.findUnique({
      where: {
        profileId_language: {
          profileId: profile.id,
          language: dto.language,
        },
      },
    });

    if (existingLanguage) {
      throw new ConflictException('Ya tienes este idioma registrado');
    }

    return this.prisma.languageProficiency.create({
      data: {
        profileId: profile.id,
        language: dto.language,
        proficiency: dto.proficiency,
      },
    });
  }

  async getLanguages(userId: string) {
    const profile = await this.getProfileByUserIdd(userId);

    return this.prisma.languageProficiency.findMany({
      where: { profileId: profile.id },
    });
  }

  async updateLanguage(id: string, userId: string, dto: UpdateLanguageDto) {
    const language = await this.prisma.languageProficiency.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!language) {
      throw new NotFoundException('Idioma no encontrado');
    }

    await this.verifyOwnership(language.profile.userId, userId);

    return this.prisma.languageProficiency.update({
      where: { id },
      data: dto,
    });
  }

  async deleteLanguage(id: string, userId: string) {
    const language = await this.prisma.languageProficiency.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!language) {
      throw new NotFoundException('Idioma no encontrado');
    }

    await this.verifyOwnership(language.profile.userId, userId);

    await this.prisma.languageProficiency.delete({ where: { id } });

    return { message: 'Idioma eliminado correctamente' };
  }

  // ==================== CV COMPLETO ====================

  async getFullCV(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
        experiences: {
          orderBy: { startDate: 'desc' },
        },
        educations: {
          orderBy: { startDate: 'desc' },
        },
        skills: {
          orderBy: [
            { endorsements: 'desc' },
            { yearsOfExperience: 'desc' },
          ],
        },
        certifications: {
          orderBy: { issueDate: 'desc' },
        },
        languages: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return {
      personalInfo: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.user.email,
        phone: profile.phone || profile.user.phone,
        jobTitle: profile.jobTitle,
        bio: profile.bio,
        profilePhotoUrl: profile.profilePhotoUrl,
        location: {
          country: profile.country,
          city: profile.city,
          address: profile.address,
        },
      },
      experiences: profile.experiences,
      educations: profile.educations,
      skills: profile.skills,
      certifications: profile.certifications,
      languages: profile.languages,
    };
  }
}
