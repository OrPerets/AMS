import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Role, Roles } from '../auth/roles.decorator';
import { VendorsService } from './vendors.service';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get('vendors')
  listVendors() {
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
  listContracts() {
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
}
