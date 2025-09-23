import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { NotificationService, NotificationTemplate } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private notifications: NotificationService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PM)
  create(@Body() dto: CreateNotificationDto) {
    return this.notifications.create(dto);
  }

  @Post('user/:id')
  @Roles(Role.ADMIN, Role.PM)
  notifyUser(@Param('id') id: string, @Body() dto: { template: NotificationTemplate; params: Record<string, string> }) {
    return this.notifications.notifyUser(+id, dto.template, dto.params);
  }

  @Post('building/:id')
  @Roles(Role.ADMIN, Role.PM)
  notifyBuilding(@Param('id') id: string, @Body() dto: { template: NotificationTemplate; params: Record<string, string> }) {
    return this.notifications.notifyBuilding(+id, dto.template, dto.params);
  }

  @Post('tenants')
  @Roles(Role.ADMIN, Role.PM)
  notifyAll(@Body() dto: { template: NotificationTemplate; params: Record<string, string> }) {
    return this.notifications.notifyAllTenants(dto.template, dto.params);
  }

  @Get('user/:id')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT, Role.ACCOUNTANT)
  getUserNotifications(@Param('id') id: string) {
    return this.notifications.getUserNotifications(+id);
  }

  @Get('building/:id')
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  getBuildingNotifications(@Param('id') id: string) {
    return this.notifications.getBuildingNotifications(+id);
  }

  @Post(':id/read')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT, Role.ACCOUNTANT)
  markAsRead(@Param('id') id: string) {
    return this.notifications.markAsRead(+id);
  }
}
