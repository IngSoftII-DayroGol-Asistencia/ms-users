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
import { EnterprisePermissionService } from './enterprise-permission.service';
import {
  AssignEnterprisePermissionDto,
  BulkAssignPermissionsDto,
} from './dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResourceType } from '@prisma/client';

@ApiTags('Enterprise Permissions')
@ApiBearerAuth('Bearer')
@UseGuards(AccessTokenGuard)
@Controller('enterprise-permission')
export class EnterprisePermissionController {
  constructor(
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) { }

  // ==================== ASSIGN PERMISSIONS ====================

  @ApiOperation({ summary: 'Asignar permiso a la empresa (solo Owner)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Permiso asignado' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Permiso ya asignado' })
  @UseGuards(OwnerGuard)
  @Post()
  assignPermission(
    @CurrentUser('id') userId: string,
    @Body() dto: AssignEnterprisePermissionDto,
  ) {
    return this.enterprisePermissionService.assignPermissionToEnterprise(userId, dto);
  }

  @ApiOperation({ summary: 'Asignar múltiples permisos a la empresa (solo Owner)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Permisos asignados' })
  @UseGuards(OwnerGuard)
  @Post('bulk')
  bulkAssignPermissions(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkAssignPermissionsDto,
  ) {
    return this.enterprisePermissionService.bulkAssignPermissions(userId, dto);
  }

  // ==================== GET PERMISSIONS ====================

  @ApiOperation({ summary: 'Obtener permisos de mi empresa' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de permisos' })
  @Get()
  getEnterprisePermissions(@CurrentUser('id') userId: string) {
    return this.enterprisePermissionService.getEnterprisePermissions(userId);
  }

  @ApiOperation({ summary: 'Obtener permisos disponibles y asignados' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permisos disponibles y asignados' })
  @Get('available')
  getAvailablePermissions(@CurrentUser('id') userId: string) {
    return this.enterprisePermissionService.getAvailablePermissions(userId);
  }

  @ApiOperation({ summary: 'Obtener permisos por recurso' })
  @ApiQuery({ name: 'resource', enum: ResourceType })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permisos del recurso' })
  @Get('resource')
  getPermissionsByResource(
    @CurrentUser('id') userId: string,
    @Query('resource') resource: ResourceType,
  ) {
    return this.enterprisePermissionService.getPermissionsByResource(userId, resource);
  }

  // ==================== UPDATE PERMISSION ====================

  @ApiOperation({ summary: 'Actualizar expiración de permiso (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Expiración actualizada' })
  @UseGuards(OwnerGuard)
  @Patch(':id/expiration')
  updateExpiration(
    @Param('id') enterprisePermissionId: string,
    @CurrentUser('id') userId: string,
    @Body('expiresAt') expiresAt: string | null,
  ) {
    return this.enterprisePermissionService.updatePermissionExpiration(
      enterprisePermissionId,
      userId,
      expiresAt,
    );
  }

  // ==================== REVOKE PERMISSION ====================

  @ApiOperation({ summary: 'Revocar permiso de la empresa (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permiso revocado' })
  @UseGuards(OwnerGuard)
  @Delete(':id')
  revokePermission(
    @Param('id') enterprisePermissionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.enterprisePermissionService.revokePermission(
      enterprisePermissionId,
      userId,
    );
  }

  // ==================== SEED PERMISSIONS ====================

  @ApiOperation({ summary: 'Crear permisos por defecto en el sistema (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permisos creados' })
  @UseGuards(OwnerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('seed')
  seedPermissions() {
    return this.enterprisePermissionService.seedDefaultPermissions();
  }
}
