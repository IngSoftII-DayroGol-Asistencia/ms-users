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
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Roles')
@ApiBearerAuth('Bearer')
@UseGuards(AccessTokenGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  // ==================== CRUD ROLES ====================

  @ApiOperation({ summary: 'Crear un nuevo rol (solo Owner)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Rol creado' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Solo el propietario puede crear roles' })
  @UseGuards(OwnerGuard)
  @Post()
  create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.create(createRoleDto, userId);
  }

  @ApiOperation({ summary: 'Obtener todos los roles de mi empresa' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de roles' })
  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.rolesService.findAll(userId);
  }

  @ApiOperation({ summary: 'Obtener mis roles' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mis roles y permisos' })
  @Get('me')
  getMyRoles(@CurrentUser('id') userId: string) {
    return this.rolesService.getMyRoles(userId);
  }

  @ApiOperation({ summary: 'Obtener todos los permisos disponibles' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de permisos' })
  @Get('permissions')
  getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @ApiOperation({ summary: 'Obtener un rol por ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Información del rol' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rol no encontrado' })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.findOne(id, userId);
  }

  @ApiOperation({ summary: 'Actualizar un rol (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rol actualizado' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Solo el propietario puede actualizar roles' })
  @UseGuards(OwnerGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.update(id, updateRoleDto, userId);
  }

  @ApiOperation({ summary: 'Eliminar un rol (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rol eliminado' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Solo el propietario puede eliminar roles' })
  @UseGuards(OwnerGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.remove(id, userId);
  }

  // ==================== ASSIGN/REMOVE ROLES ====================

  @ApiOperation({ summary: 'Asignar rol a un usuario (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rol asignado' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Solo el propietario puede asignar roles' })
  @UseGuards(OwnerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('assign')
  assignRoleToUser(
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.assignRoleToUser(assignRoleDto, userId);
  }

  @ApiOperation({ summary: 'Remover rol de un usuario (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rol removido' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Solo el propietario puede remover roles' })
  @UseGuards(OwnerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('remove')
  removeRoleFromUser(
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.removeRoleFromUser(assignRoleDto, userId);
  }

  @ApiOperation({ summary: 'Obtener roles de un usuario' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Roles del usuario' })
  @Get('user/:userId')
  getUserRoles(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.getUserRoles(targetUserId, userId);
  }

  // ==================== ROLE PERMISSIONS ====================

  @ApiOperation({ summary: 'Agregar permiso a un rol (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permiso agregado' })
  @UseGuards(OwnerGuard)
  @HttpCode(HttpStatus.OK)
  @Post(':roleId/permissions/:permissionId')
  addPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.addPermissionToRole(roleId, permissionId, userId);
  }

  @ApiOperation({ summary: 'Remover permiso de un rol (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permiso removido' })
  @UseGuards(OwnerGuard)
  @Delete(':roleId/permissions/:permissionId')
  removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.removePermissionFromRole(roleId, permissionId, userId);
  }
}
