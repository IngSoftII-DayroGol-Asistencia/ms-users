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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRelationshipService } from './user-relationship.service';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
  HandleRelationshipDto,
} from './dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('User Relationships')
@ApiBearerAuth('Bearer')
@UseGuards(AccessTokenGuard)
@Controller('user-relationship')
export class UserRelationshipController {
  constructor(private readonly userRelationshipService: UserRelationshipService) { }

  // ==================== CREATE/SEND REQUEST ====================

  @ApiOperation({ summary: 'Enviar solicitud de conexión' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Solicitud enviada' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Ya existe una relación' })
  @Post()
  createRelationship(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRelationshipDto,
  ) {
    return this.userRelationshipService.createRelationship(userId, dto);
  }

  // ==================== HANDLE REQUESTS ====================

  @ApiOperation({ summary: 'Aceptar, rechazar o bloquear solicitud' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Solicitud procesada' })
  @HttpCode(HttpStatus.OK)
  @Post('handle')
  handleRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: HandleRelationshipDto,
  ) {
    return this.userRelationshipService.handleRelationshipRequest(userId, dto);
  }

  // ==================== GET CONNECTIONS ====================

  @ApiOperation({ summary: 'Obtener mis conexiones' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de conexiones' })
  @Get('connections')
  getMyConnections(@CurrentUser('id') userId: string) {
    return this.userRelationshipService.getMyConnections(userId);
  }

  @ApiOperation({ summary: 'Obtener conexiones por tipo' })
  @ApiQuery({ name: 'type', enum: ['CONTACT', 'COLLABORATOR', 'FRIEND', 'COLLEAGUE', 'MENTOR', 'MENTEE', 'TEAM_MEMBER'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de conexiones filtradas' })
  @Get('connections/type')
  getConnectionsByType(
    @CurrentUser('id') userId: string,
    @Query('type') type: string,
  ) {
    return this.userRelationshipService.getConnectionsByType(userId, type);
  }

  @ApiOperation({ summary: 'Obtener estadísticas de conexiones' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Estadísticas' })
  @Get('stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.userRelationshipService.getConnectionStats(userId);
  }

  // ==================== PENDING REQUESTS ====================

  @ApiOperation({ summary: 'Obtener solicitudes recibidas pendientes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de solicitudes recibidas' })
  @Get('requests/received')
  getPendingReceived(@CurrentUser('id') userId: string) {
    return this.userRelationshipService.getPendingRequestsReceived(userId);
  }

  @ApiOperation({ summary: 'Obtener solicitudes enviadas pendientes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de solicitudes enviadas' })
  @Get('requests/sent')
  getPendingSent(@CurrentUser('id') userId: string) {
    return this.userRelationshipService.getPendingRequestsSent(userId);
  }

  @ApiOperation({ summary: 'Cancelar solicitud pendiente enviada' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Solicitud cancelada' })
  @Delete('requests/:id/cancel')
  cancelRequest(
    @Param('id') relationshipId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.userRelationshipService.cancelPendingRequest(relationshipId, userId);
  }

  // ==================== BLOCKED USERS ====================

  @ApiOperation({ summary: 'Obtener usuarios bloqueados' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de usuarios bloqueados' })
  @Get('blocked')
  getBlockedUsers(@CurrentUser('id') userId: string) {
    return this.userRelationshipService.getBlockedUsers(userId);
  }

  @ApiOperation({ summary: 'Bloquear usuario' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Usuario bloqueado' })
  @HttpCode(HttpStatus.OK)
  @Post('block/:userId')
  blockUser(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.userRelationshipService.blockUser(targetUserId, userId);
  }

  @ApiOperation({ summary: 'Desbloquear usuario' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Usuario desbloqueado' })
  @Delete('unblock/:relationshipId')
  unblockUser(
    @Param('relationshipId') relationshipId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.userRelationshipService.unblockUser(relationshipId, userId);
  }

  // ==================== CHECK RELATIONSHIP ====================

  @ApiOperation({ summary: 'Verificar relación con un usuario' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Estado de la relación' })
  @Get('check/:targetUserId')
  checkRelationship(
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.userRelationshipService.checkRelationship(userId, targetUserId);
  }

  // ==================== UPDATE RELATIONSHIP ====================

  @ApiOperation({ summary: 'Actualizar tipo de relación' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relación actualizada' })
  @Patch(':id')
  updateRelationship(
    @Param('id') relationshipId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRelationshipDto,
  ) {
    return this.userRelationshipService.updateRelationship(relationshipId, userId, dto);
  }

  // ==================== REMOVE CONNECTION ====================

  @ApiOperation({ summary: 'Eliminar conexión' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Conexión eliminada' })
  @Delete(':id')
  removeConnection(
    @Param('id') relationshipId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.userRelationshipService.removeConnection(relationshipId, userId);
  }
}
