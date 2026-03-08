import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.decorator';
import { Response } from 'express';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get()
  kpis(@Query('buildingId') buildingId?: string) {
    return this.dashboard.kpis({ buildingId: buildingId ? +buildingId : undefined });
  }

  @Get('overview')
  overview(@Query('buildingId') buildingId?: string, @Query('range') range?: string) {
    return this.dashboard.overview({ buildingId: buildingId ? +buildingId : undefined, range });
  }

  @Get('charts')
  charts(@Query('buildingId') buildingId?: string) {
    return this.dashboard.charts({ buildingId: buildingId ? +buildingId : undefined });
  }

  @Get('export')
  async export(@Res() res: Response, @Query('buildingId') buildingId?: string) {
    const csv = await this.dashboard.exportInvoices({ buildingId: buildingId ? +buildingId : undefined });
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  }
}
