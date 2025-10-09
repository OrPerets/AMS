import { Controller, Get, Param, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/roles.decorator';
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

  @Get('monthly')
  monthly(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('buildingId') buildingId?: string,
  ) {
    const currentDate = new Date();
    const reportYear = year ? +year : currentDate.getFullYear();
    const reportMonth = month ? +month : currentDate.getMonth() + 1;
    return this.reports.getMonthlyReport(reportYear, reportMonth, buildingId ? +buildingId : undefined);
  }

  @Get('yearly')
  yearly(
    @Query('year') year?: string,
    @Query('buildingId') buildingId?: string,
  ) {
    const reportYear = year ? +year : new Date().getFullYear();
    return this.reports.getYearlyReport(reportYear, buildingId ? +buildingId : undefined);
  }

  @Get('comparison')
  comparison(
    @Query('year1') year1: string,
    @Query('month1') month1?: string,
    @Query('year2') year2?: string,
    @Query('month2') month2?: string,
    @Query('buildingId') buildingId?: string,
  ) {
    const y1 = +year1;
    const m1 = month1 ? +month1 : undefined;
    const y2 = year2 ? +year2 : y1;
    const m2 = month2 ? +month2 : undefined;
    return this.reports.getComparisonReport(y1, m1, y2, m2, buildingId ? +buildingId : undefined);
  }

  @Get('templates')
  templates() {
    return this.reports.getTemplates();
  }

  @Get('export/:type')
  async export(
    @Param('type') type: 'summary' | 'pnl' | 'cash-flow' | 'variance' | 'monthly',
    @Query('format') format: 'csv' | 'xlsx' | 'pdf' = 'csv',
    @Query('buildingId') buildingId: string | undefined,
    @Query('year') year: string | undefined,
    @Query('month') month: string | undefined,
    @Res() res: Response,
  ) {
    const { filename, contentType, buffer } = await this.reports.export(type, format, { 
      buildingId: buildingId ? +buildingId : undefined,
      year: year ? +year : undefined,
      month: month ? +month : undefined,
    });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post('schedule')
  schedule(@Body() body: { type: 'summary' | 'pnl' | 'cash-flow' | 'variance'; cron: string; recipients: string[] }) {
    return this.reports.scheduleReport(body);
  }
}


