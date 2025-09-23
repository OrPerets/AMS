import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';

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
}


