import { Body, Controller, Param, Post } from '@nestjs/common';
import { NotificationService, NotificationTemplate } from './notification.service';

@Controller('notifications')
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
