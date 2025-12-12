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
  ApiTags
} from '@nestjs/swagger';
import { EnterpriseService } from './enterprise.service';
import {
  CreateEnterpriseDto,
  UpdateEnterpriseDto,
  JoinEnterpriseDto,
  HandleJoinRequestDto,
} from './dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OwnerGuard } from 'src/auth/guards';

@ApiTags('Enterprise')
@ApiBearerAuth('Bearer')
@UseGuards(AccessTokenGuard)
@Controller('enterprise')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) { }

  // ==================== CRUD ENTERPRISE ====================

  @ApiOperation({ summary: 'Crear una nueva empresa' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Empresa creada exitosamente' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Ya existe una empresa con ese nombre o el usuario ya pertenece a una empresa' })
  @Post()
  create(
    @Body() createEnterpriseDto: CreateEnterpriseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.enterpriseService.create(createEnterpriseDto, userId);
  }

  @ApiOperation({ summary: 'Obtener todas las empresas' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de empresas' })
  @Get()
  findAll() {
    return this.enterpriseService.findAll();
  }

  @ApiOperation({ summary: 'Obtener mi empresa actual' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Información de la empresa del usuario' })
  @Get('me')
  getMyEnterprise(@CurrentUser('id') userId: string) {
    return this.enterpriseService.getMyEnterprise(userId);
  }

  @ApiOperation({ summary: 'Obtener una empresa por ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Información de la empresa' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Empresa no encontrada' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enterpriseService.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar una empresa' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Empresa actualizada' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'No tienes permisos' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEnterpriseDto: UpdateEnterpriseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.enterpriseService.update(id, updateEnterpriseDto, userId);
  }

  @ApiOperation({ summary: 'Eliminar una empresa (soft delete)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Empresa eliminada' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'No tienes permisos' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.enterpriseService.remove(id, userId);
  }

  // ==================== JOIN REQUESTS ====================

  @ApiOperation({ summary: 'Solicitar unirse a una empresa' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Solicitud enviada' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Ya tienes una solicitud pendiente o ya perteneces a una empresa' })
  @Post('join')
  requestToJoin(
    @Body() joinEnterpriseDto: JoinEnterpriseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.enterpriseService.requestToJoin(joinEnterpriseDto, userId);
  }

  @ApiOperation({ summary: 'Ver mis solicitudes de unión' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de solicitudes' })
  @Get('join/my-requests')
  getMyRequests(@CurrentUser('id') userId: string) {
    return this.enterpriseService.getMyRequests(userId);
  }

  @ApiOperation({ summary: 'Cancelar una solicitud de unión' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Solicitud cancelada' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Solicitud no encontrada' })
  @Delete('join/:requestId')
  cancelJoinRequest(
    @Param('requestId') requestId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.enterpriseService.cancelJoinRequest(requestId, userId);
  }

  @ApiOperation({ summary: 'Ver solicitudes pendientes de mi empresa' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de solicitudes pendientes' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'No tienes permisos' })
  @Get(':enterpriseId/join-requests')
  getPendingRequests(
    @Param('enterpriseId') enterpriseId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.enterpriseService.getPendingRequests(enterpriseId, userId);
  }

  @ApiOperation({ summary: 'Aprobar o rechazar una solicitud de unión' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Solicitud procesada' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'No tienes permisos' })
  @HttpCode(HttpStatus.OK)
  @Post('join/handle')
  handleJoinRequest(
    @Body() handleDto: HandleJoinRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.enterpriseService.handleJoinRequest(handleDto, userId);
  }

  // ==================== LEAVE ENTERPRISE ====================

  @ApiOperation({ summary: 'Salir de la empresa actual' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Has salido de la empresa' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No perteneces a ninguna empresa' })
  @HttpCode(HttpStatus.OK)
  @Post('leave')
  leaveEnterprise(@CurrentUser('id') userId: string) {
    return this.enterpriseService.leaveEnterprise(userId);
  }

  @ApiOperation({ summary: 'Transferir propiedad de la empresa (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Propiedad transferida' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Solo el propietario puede transferir' })
  @UseGuards(OwnerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('transfer-ownership/:newOwnerId')
  transferOwnership(
    @Param('newOwnerId') newOwnerId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.enterpriseService.transferOwnership(newOwnerId, userId);
  }

  @ApiOperation({ summary: 'Eliminar un miembro de la empresa (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Miembro eliminado' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Solo el propietario puede eliminar miembros' })
  @UseGuards(OwnerGuard)
  @Delete('member/:memberId')
  removeMember(
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.enterpriseService.removeMember(memberId, userId);
  }

}
