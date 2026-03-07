import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.decorator';

@Controller('api/v1/units')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM)
export class UnitController {
  constructor(private readonly units: UnitService) {}

  @Post()
  create(@Body() dto: CreateUnitDto) {
    const {
      residentIds,
      buildingId,
      number,
      area,
      bedrooms,
      bathrooms,
      parkingSpaces,
      floor,
    } = dto;
    const data = {
      number,
      area,
      bedrooms,
      bathrooms,
      parkingSpaces,
      floor,
      building: { connect: { id: buildingId } },
    };
    return this.units.create(data as any, residentIds);
  }

  @Get()
  findAll(@Query('buildingId') buildingId?: string) {
    return this.units.findAll(buildingId ? +buildingId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.units.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    const { residentIds } = dto;
    const data: any = {};
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.buildingId !== undefined) data.building = { connect: { id: dto.buildingId } };
    if (dto.area !== undefined) data.area = dto.area;
    if (dto.bedrooms !== undefined) data.bedrooms = dto.bedrooms;
    if (dto.bathrooms !== undefined) data.bathrooms = dto.bathrooms;
    if (dto.parkingSpaces !== undefined) data.parkingSpaces = dto.parkingSpaces;
    if (dto.floor !== undefined) data.floor = dto.floor;
    return this.units.update(+id, data, residentIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.units.remove(+id);
  }
}
