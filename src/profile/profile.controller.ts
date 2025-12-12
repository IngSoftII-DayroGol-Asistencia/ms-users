import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
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
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Profile')
@ApiBearerAuth('Bearer')
@UseGuards(AccessTokenGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  // ==================== PROFILE ====================

  @ApiOperation({ summary: 'Obtener mi perfil completo' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Perfil del usuario' })
  @Get('me')
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getMyProfile(userId);
  }

  @ApiOperation({ summary: 'Obtener mi CV completo' })
  @ApiResponse({ status: HttpStatus.OK, description: 'CV estructurado del usuario' })
  @Get('me/cv')
  getMyCV(@CurrentUser('id') userId: string) {
    return this.profileService.getFullCV(userId);
  }

  @ApiOperation({ summary: 'Actualizar mi perfil' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Perfil actualizado' })
  @Patch('me')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, updateProfileDto);
  }

  @ApiOperation({ summary: 'Obtener perfil por ID de usuario' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Perfil del usuario' })
  @Get('user/:userId')
  getProfileByUserId(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.profileService.getProfileByUserId(targetUserId, requesterId);
  }

  // ==================== EXPERIENCE ====================

  @ApiOperation({ summary: 'Agregar experiencia laboral' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Experiencia creada' })
  @Post('experience')
  createExperience(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateExperienceDto,
  ) {
    return this.profileService.createExperience(userId, dto);
  }

  @ApiOperation({ summary: 'Obtener mis experiencias laborales' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de experiencias' })
  @Get('experience')
  getExperiences(@CurrentUser('id') userId: string) {
    return this.profileService.getExperiences(userId);
  }

  @ApiOperation({ summary: 'Obtener experiencia por ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Experiencia' })
  @Get('experience/:id')
  getExperienceById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.profileService.getExperienceById(id, userId);
  }

  @ApiOperation({ summary: 'Actualizar experiencia laboral' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Experiencia actualizada' })
  @Patch('experience/:id')
  updateExperience(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.profileService.updateExperience(id, userId, dto);
  }

  @ApiOperation({ summary: 'Eliminar experiencia laboral' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Experiencia eliminada' })
  @Delete('experience/:id')
  deleteExperience(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.profileService.deleteExperience(id, userId);
  }

  // ==================== EDUCATION ====================

  @ApiOperation({ summary: 'Agregar educación' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Educación creada' })
  @Post('education')
  createEducation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEducationDto,
  ) {
    return this.profileService.createEducation(userId, dto);
  }

  @ApiOperation({ summary: 'Obtener mi educación' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de educación' })
  @Get('education')
  getEducations(@CurrentUser('id') userId: string) {
    return this.profileService.getEducations(userId);
  }

  @ApiOperation({ summary: 'Obtener educación por ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Educación' })
  @Get('education/:id')
  getEducationById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.profileService.getEducationById(id, userId);
  }

  @ApiOperation({ summary: 'Actualizar educación' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Educación actualizada' })
  @Patch('education/:id')
  updateEducation(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.profileService.updateEducation(id, userId, dto);
  }

  @ApiOperation({ summary: 'Eliminar educación' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Educación eliminada' })
  @Delete('education/:id')
  deleteEducation(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.profileService.deleteEducation(id, userId);
  }

  // ==================== SKILLS ====================

  @ApiOperation({ summary: 'Agregar habilidad' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Habilidad creada' })
  @Post('skill')
  createSkill(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSkillDto,
  ) {
    return this.profileService.createSkill(userId, dto);
  }

  @ApiOperation({ summary: 'Obtener mis habilidades' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de habilidades' })
  @Get('skill')
  getSkills(@CurrentUser('id') userId: string) {
    return this.profileService.getSkills(userId);
  }

  @ApiOperation({ summary: 'Actualizar habilidad' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Habilidad actualizada' })
  @Patch('skill/:id')
  updateSkill(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.profileService.updateSkill(id, userId, dto);
  }

  @ApiOperation({ summary: 'Eliminar habilidad' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Habilidad eliminada' })
  @Delete('skill/:id')
  deleteSkill(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.profileService.deleteSkill(id, userId);
  }

  @ApiOperation({ summary: 'Recomendar habilidad de otro usuario' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Habilidad recomendada' })
  @HttpCode(HttpStatus.OK)
  @Post('skill/:id/endorse')
  endorseSkill(
    @Param('id') skillId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.profileService.endorseSkill(skillId, userId);
  }

  // ==================== CERTIFICATIONS ====================

  @ApiOperation({ summary: 'Agregar certificación' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Certificación creada' })
  @Post('certification')
  createCertification(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCertificationDto,
  ) {
    return this.profileService.createCertification(userId, dto);
  }

  @ApiOperation({ summary: 'Obtener mis certificaciones' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de certificaciones' })
  @Get('certification')
  getCertifications(@CurrentUser('id') userId: string) {
    return this.profileService.getCertifications(userId);
  }

  @ApiOperation({ summary: 'Obtener certificación por ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Certificación' })
  @Get('certification/:id')
  getCertificationById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.profileService.getCertificationById(id, userId);
  }

  @ApiOperation({ summary: 'Actualizar certificación' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Certificación actualizada' })
  @Patch('certification/:id')
  updateCertification(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCertificationDto,
  ) {
    return this.profileService.updateCertification(id, userId, dto);
  }

  @ApiOperation({ summary: 'Eliminar certificación' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Certificación eliminada' })
  @Delete('certification/:id')
  deleteCertification(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.profileService.deleteCertification(id, userId);
  }

  // ==================== LANGUAGES ====================

  @ApiOperation({ summary: 'Agregar idioma' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Idioma agregado' })
  @Post('language')
  createLanguage(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLanguageDto,
  ) {
    return this.profileService.createLanguage(userId, dto);
  }

  @ApiOperation({ summary: 'Obtener mis idiomas' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de idiomas' })
  @Get('language')
  getLanguages(@CurrentUser('id') userId: string) {
    return this.profileService.getLanguages(userId);
  }

  @ApiOperation({ summary: 'Actualizar idioma' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Idioma actualizado' })
  @Patch('language/:id')
  updateLanguage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this.profileService.updateLanguage(id, userId, dto);
  }

  @ApiOperation({ summary: 'Eliminar idioma' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Idioma eliminado' })
  @Delete('language/:id')
  deleteLanguage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.profileService.deleteLanguage(id, userId);
  }
}
