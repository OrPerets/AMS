import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { BuildingService } from './building.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Public } from '../auth/roles.decorator';

@Controller('api/v1/buildings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM)
export class BuildingController {
  constructor(private readonly buildings: BuildingService) {}

  @Post()
  create(@Body() dto: CreateBuildingDto) {
    return this.buildings.create(dto);
  }

  // Public list endpoint for frontend
  @Public()
  @Get()
  findAll() {
    return this.buildings.findAll();
  }

  @Get(':id/details')
  findDetails(@Param('id') id: string) {
    return this.buildings.findDetailed(+id);
  }

  @Get(':id/overview')
  getOverview(@Param('id') id: string) {
    return this.buildings.getOverview(+id);
  }

  @Get(':id/maintenance/upcoming')
  getUpcomingMaintenance(@Param('id') id: string) {
    return this.buildings.getUpcomingMaintenance(+id);
  }

  @Get(':id/financial/summary')
  getFinancialSummary(@Param('id') id: string) {
    return this.buildings.getFinancialSummary(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buildings.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    return this.buildings.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.buildings.remove(+id);
  }
}
