import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
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

  @Get('approvals')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
  approvals(@Query('buildingId') buildingId?: string, @Query('status') status?: string) {
    return this.admin.approvalsList({
      buildingId: buildingId ? Number(buildingId) : undefined,
      status,
    });
  }

  @Post('approvals/:id/approve')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
  approveTask(@Param('id') id: string, @Req() req: any, @Body() body: { comment?: string }) {
    return this.admin.approveTask(Number(id), req.user?.sub, req.user?.actAsRole ?? req.user?.role, body?.comment);
  }

  @Post('approvals/:id/reject')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
  rejectTask(@Param('id') id: string, @Req() req: any, @Body() body: { comment?: string }) {
    return this.admin.rejectTask(Number(id), req.user?.sub, req.user?.actAsRole ?? req.user?.role, body?.comment);
  }

  @Get('data-quality')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
  dataQuality() {
    return this.admin.dataQuality();
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
