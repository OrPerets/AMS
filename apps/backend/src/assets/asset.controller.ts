import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/v1/assets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.TECH)
export class AssetController {
  constructor(private assets: AssetService) {}

  @Post()
  create(@Body() dto: CreateAssetDto) {
    return this.assets.create(dto);
  }

  @Get()
  findAll() {
    return this.assets.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assets.findOne(+id);
  }

  @Get('building/:buildingId')
  findForBuilding(@Param('buildingId') buildingId: string) {
    return this.assets.findForBuilding(+buildingId);
  }

  @Get(':id/health')
  getHealth(@Param('id') id: string) {
    return this.assets.getAssetHealth(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assets.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assets.remove(+id);
  }
}
