import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenance.findOne(+id);
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maintenance.remove(+id);
  }
}
