import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { NotificationService, NotificationTemplate } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM)
export class NotificationController {
  constructor(private notifications: NotificationService) {}

  @Post('user/:id')
  notifyUser(@Param('id') id: string, @Body() dto: { template: NotificationTemplate; params: Record<string, string> }) {
    return this.notifications.notifyUser(+id, dto.template, dto.params);
  }

  @Post('building/:id')
  notifyBuilding(@Param('id') id: string, @Body() dto: { template: NotificationTemplate; params: Record<string, string> }) {
    return this.notifications.notifyBuilding(+id, dto.template, dto.params);
  }

  @Post('tenants')
  notifyAll(@Body() dto: { template: NotificationTemplate; params: Record<string, string> }) {
    return this.notifications.notifyAllTenants(dto.template, dto.params);
  }
}
