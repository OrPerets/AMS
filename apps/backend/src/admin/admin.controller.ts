import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Roles, Role } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { ImpersonateDto } from './dto/impersonate.dto';
import { Response } from 'express';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('overview')
  @Roles(Role.ADMIN, Role.MASTER)
  overview() {
    return this.admin.overview();
  }

  @Get('activity')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
  activity(@Query('buildingId') buildingId?: string, @Query('severity') severity?: string, @Query('entityType') entityType?: string) {
    return this.admin.activity({
      buildingId: buildingId ? Number(buildingId) : undefined,
      severity,
      entityType,
    });
  }

  @Get('activity/export')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
  async exportActivity(@Res() res: Response, @Query('buildingId') buildingId?: string) {
    const csv = await this.admin.exportActivity({ buildingId: buildingId ? Number(buildingId) : undefined });
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  }

  @Post('impersonate')
  @Roles(Role.MASTER)
  impersonate(@Req() req: any, @Body() dto: ImpersonateDto) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    return this.admin.impersonate(req.user, dto, ip, userAgent);
  }

  @Post('impersonate/stop')
  @Roles(Role.MASTER)
  stop(@Req() req: any) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    return this.admin.stopImpersonation(req.user, ip, userAgent);
  }
}
