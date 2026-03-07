import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles, Role } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { ImpersonateDto } from './dto/impersonate.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('overview')
  @Roles(Role.ADMIN, Role.MASTER)
  overview() {
    return this.admin.overview();
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
