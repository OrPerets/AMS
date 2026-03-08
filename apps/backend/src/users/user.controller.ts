import { BadRequestException, Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private users: UserService) {}

  @Get('users')
  @Roles(Role.ADMIN)
  findAll() {
    return this.users.findAll();
  }

  @Get('api/v1/users/residents')
  @Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
  listResidents() {
    return this.users.listResidents();
  }

  @Get('api/v1/users/technicians')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.MASTER)
  listTechnicians() {
    return this.users.listTechnicians();
  }

  @Get('api/v1/users/profile')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT, Role.ACCOUNTANT, Role.MASTER)
  profile(@Req() req: any) {
    return this.users.findProfile(req.user.sub);
  }

  @Patch('api/v1/users/profile')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT, Role.ACCOUNTANT, Role.MASTER)
  updateProfile(
    @Req() req: any,
    @Body()
    body: {
      email?: string;
      phone?: string | null;
      pushToken?: string | null;
      notificationPreferences?: Record<string, boolean>;
    },
  ) {
    return this.users.updateProfile(req.user.sub, body);
  }

  @Post('api/v1/users/change-password')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT, Role.ACCOUNTANT, Role.MASTER)
  async changePassword(
    @Req() req: any,
    @Body() body: { currentPassword?: string; newPassword?: string },
  ) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Current password and new password are required');
    }
    if (body.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    try {
      return await this.users.changePassword(req.user.sub, body.currentPassword, body.newPassword);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Password change failed');
    }
  }
}
