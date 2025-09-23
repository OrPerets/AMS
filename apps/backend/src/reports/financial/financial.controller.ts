import { Controller, Get, Param, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';

@Controller('api/v1/reports/financial')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
export class FinancialController {
  constructor(private reports: FinancialService) {}

  @Get('summary')
  summary(@Query('tenantId') tenantId?: string) {
    return this.reports.getSummary(tenantId ? +tenantId : undefined);
  }

  @Get('pnl')
  pnl() {
    return this.reports.getProfitAndLoss();
  }

  @Get('cash-flow')
  cashFlow() {
    return this.reports.getCashFlow();
  }

  @Get('variance')
  variance(@Query('buildingId') buildingId?: string) {
    return this.reports.getVarianceReport(buildingId ? +buildingId : undefined);
  }

  @Get('forecast')
  forecast() {
    return this.reports.getForecast();
  }

  @Get('templates')
  templates() {
    return this.reports.getTemplates();
  }

  @Get('export/:type')
  async export(
    @Param('type') type: 'summary' | 'pnl' | 'cash-flow' | 'variance',
    @Query('format') format: 'csv' | 'xlsx' | 'pdf' = 'csv',
    @Query('buildingId') buildingId: string | undefined,
    @Res() res: Response,
  ) {
    const { filename, contentType, buffer } = await this.reports.export(type, format, { buildingId: buildingId ? +buildingId : undefined });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post('schedule')
  schedule(@Body() body: { type: 'summary' | 'pnl' | 'cash-flow' | 'variance'; cron: string; recipients: string[] }) {
    return this.reports.scheduleReport(body);
  }
}


