import { Body, Controller, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Role, Roles } from '../auth/roles.decorator';
import { VendorsService } from './vendors.service';
import { Response } from 'express';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get('vendors')
  async listVendors(@Query('format') format?: string, @Res({ passthrough: true }) res?: Response) {
    if (format === 'csv' && res) {
      const csv = await this.vendors.exportVendorsCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="vendors.csv"');
      return csv;
    }
    return this.vendors.listVendors();
  }

  @Post('vendors')
  createVendor(@Body() body: any, @Req() req: any) {
    return this.vendors.createVendor(body, req.user?.sub);
  }

  @Put('vendors/:id')
  updateVendor(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.vendors.updateVendor(Number(id), body, req.user?.sub);
  }

  @Get('contracts')
  async listContracts(@Query('format') format?: string, @Res({ passthrough: true }) res?: Response) {
    if (format === 'csv' && res) {
      const csv = await this.vendors.exportContractsCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contracts.csv"');
      return csv;
    }
    return this.vendors.listContracts();
  }

  @Post('contracts')
  createContract(@Body() body: any, @Req() req: any) {
    return this.vendors.createContract(body, req.user?.sub);
  }

  @Put('contracts/:id')
  updateContract(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.vendors.updateContract(Number(id), body, req.user?.sub);
  }

  @Post('portfolio/reminders/run')
  runPortfolioReminders(@Req() req: any) {
    return this.vendors.runPortfolioReminders(req.user?.sub);
  }
}
