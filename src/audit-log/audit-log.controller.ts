import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Audit Logs')
@ApiBearerAuth('Bearer')
@UseGuards(AccessTokenGuard)
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) { }

  // ==================== GET LOGS ====================

  @ApiOperation({ summary: 'Obtener logs de la empresa (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de logs' })
  @UseGuards(OwnerGuard)
  @Get()
  getEnterpriseLogs(
    @CurrentUser('id') userId: string,
    @Query() query: QueryAuditLogDto,
  ) {
    return this.auditLogService.getEnterpriseLogs(userId, query);
  }

  @ApiOperation({ summary: 'Obtener mis logs de actividad' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mis logs' })
  @Get('me')
  getMyLogs(
    @CurrentUser('id') userId: string,
    @Query() query: QueryAuditLogDto,
  ) {
    return this.auditLogService.getMyLogs(userId, query);
  }

  @ApiOperation({ summary: 'Obtener estadísticas de auditoría (solo Owner)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Días a analizar (default: 30)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Estadísticas' })
  @UseGuards(OwnerGuard)
  @Get('stats')
  getStats(
    @CurrentUser('id') userId: string,
    @Query('days') days?: number,
  ) {
    return this.auditLogService.getAuditStats(userId, days || 30);
  }

  @ApiOperation({ summary: 'Exportar logs (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logs exportados' })
  @UseGuards(OwnerGuard)
  @Get('export')
  exportLogs(
    @CurrentUser('id') userId: string,
    @Query() query: QueryAuditLogDto,
  ) {
    return this.auditLogService.exportLogs(userId, query);
  }

  @ApiOperation({ summary: 'Obtener log por ID (solo Owner)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Detalle del log' })
  @UseGuards(OwnerGuard)
  @Get(':id')
  getLogById(
    @Param('id') logId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.auditLogService.getLogById(logId, userId);
  }

  // ==================== CLEANUP ====================

  @ApiOperation({ summary: 'Limpiar logs antiguos (solo Owner)' })
  @ApiQuery({ name: 'daysToKeep', required: false, type: Number, description: 'Días a conservar (default: 90)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logs eliminados' })
  @UseGuards(OwnerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('cleanup')
  cleanupOldLogs(@Query('daysToKeep') daysToKeep?: number) {
    return this.auditLogService.cleanupOldLogs(daysToKeep || 90);
  }
}
