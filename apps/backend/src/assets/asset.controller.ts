import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards, Res } from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.decorator';
import { UpdateAssetLocationDto } from './dto/update-asset-location.dto';
import { AssetDepreciationOptionsDto } from './dto/asset-depreciation-options.dto';
import { Response } from 'express';

@Controller('api/v1/assets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.TECH)
export class AssetController {
  constructor(private assets: AssetService) {}

  private parseDepreciationQuery(query: AssetDepreciationOptionsDto) {
    const options: AssetDepreciationOptionsDto = {};
    if (query.usefulLifeYears !== undefined) {
      const value = Number.parseInt(query.usefulLifeYears as unknown as string, 10);
      if (!Number.isNaN(value)) {
        options.usefulLifeYears = value;
      }
    }
    if (query.salvageValue !== undefined) {
      const value = Number.parseFloat(query.salvageValue as unknown as string);
      if (!Number.isNaN(value)) {
        options.salvageValue = value;
      }
    }
    return options;
  }

  @Post()
  create(@Body() dto: CreateAssetDto) {
    return this.assets.create(dto);
  }

  @Get()
  findAll(@Query('buildingId') buildingId?: string) {
    return buildingId ? this.assets.findForBuilding(+buildingId) : this.assets.findAll();
  }

  @Get('building/:buildingId/inventory')
  getInventory(@Param('buildingId') buildingId: string) {
    return this.assets.getInventorySummary(+buildingId);
  }

  @Get('building/:buildingId')
  findForBuilding(@Param('buildingId') buildingId: string) {
    return this.assets.findForBuilding(+buildingId);
  }

  @Get('lifecycle/summary')
  getLifecycleSummary(@Query('buildingId') buildingId?: string) {
    return this.assets.getLifecycleSummary(buildingId ? +buildingId : undefined);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string, @Query('format') format?: string, @Res({ passthrough: true }) res?: Response) {
    if (format === 'csv' && res) {
      const csv = await this.assets.exportMaintenanceHistoryCsv(+id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="asset-maintenance-history.csv"');
      return csv;
    }
    return this.assets.getMaintenanceHistory(+id);
  }

  @Get(':id/depreciation')
  getDepreciation(@Param('id') id: string, @Query() query: AssetDepreciationOptionsDto) {
    return this.assets.calculateDepreciation(+id, this.parseDepreciationQuery(query));
  }

  @Get(':id/warranty')
  getWarranty(@Param('id') id: string) {
    return this.assets.getWarrantyStatus(+id);
  }

  @Get(':id/health')
  getHealth(@Param('id') id: string) {
    return this.assets.getAssetHealth(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assets.findOne(+id);
  }

  @Post(':id/inventory-verify')
  verifyInventory(
    @Param('id') id: string,
    @Body() body: { notes?: string; nextInventoryCheck?: string | null; replacementRecommended?: boolean; replacementNotes?: string | null },
  ) {
    return this.assets.verifyInventory(+id, body);
  }

  @Patch(':id/location')
  updateLocation(@Param('id') id: string, @Body() dto: UpdateAssetLocationDto) {
    return this.assets.updateLocation(+id, dto);
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
