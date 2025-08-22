import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/v1/units')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM)
export class UnitController {
  constructor(private readonly units: UnitService) {}

  @Post()
  create(@Body() dto: CreateUnitDto) {
    const { residentIds, ...data } = dto;
    return this.units.create(data, residentIds);
  }

  @Get()
  findAll() {
    return this.units.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.units.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    const { residentIds, ...data } = dto;
    return this.units.update(+id, data, residentIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.units.remove(+id);
  }
}
