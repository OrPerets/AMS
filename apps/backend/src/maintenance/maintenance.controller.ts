import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto';
import { VerifyMaintenanceDto } from './dto/verify-maintenance.dto';

@Controller('api/v1/maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.TECH)
export class MaintenanceController {
  constructor(private maintenance: MaintenanceService) {}

  @Post()
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenance.create(dto);
  }

  @Get()
  findAll() {
    return this.maintenance.findAll();
  }

  @Get('building/:buildingId/alerts')
  getAlerts(@Param('buildingId') buildingId: string, @Query('daysAhead') daysAhead?: string) {
    const ahead = daysAhead ? Number.parseInt(daysAhead, 10) : undefined;
    const normalized = ahead && ahead > 0 ? ahead : 7;
    return this.maintenance.getAlerts(+buildingId, normalized);
  }

  @Get('building/:buildingId/cost-projection')
  getCostProjection(
    @Param('buildingId') buildingId: string,
    @Query('monthsAhead') monthsAhead?: string,
  ) {
    const ahead = monthsAhead ? Number.parseInt(monthsAhead, 10) : undefined;
    const normalized = ahead && ahead > 0 ? ahead : 3;
    return this.maintenance.getCostProjection(+buildingId, normalized);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenance.findOne(+id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.maintenance.getHistory(+id);
  }

  @Get('building/:buildingId')
  findByBuilding(@Param('buildingId') buildingId: string) {
    return this.maintenance.findByBuilding(+buildingId);
  }

  @Get('building/:buildingId/calendar')
  getCalendar(
    @Param('buildingId') buildingId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 30);
    return this.maintenance.getCalendar(+buildingId, startDate, endDate);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto) {
    return this.maintenance.update(+id, dto);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteMaintenanceDto) {
    return this.maintenance.recordCompletion(+id, dto);
  }

  @Post(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyMaintenanceDto) {
    return this.maintenance.verifyCompletion(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maintenance.remove(+id);
  }
}
