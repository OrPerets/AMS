import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Role, Roles } from '../auth/roles.decorator';
import { OperationsService } from './operations.service';

@Controller('api/v1/operations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT, Role.MASTER)
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get('calendar')
  calendar(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('buildingId') buildingId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    return this.operations.getCalendar({
      start: start || defaultStart,
      end: end || defaultEnd,
      buildingId: buildingId ? Number(buildingId) : undefined,
      type,
      status,
      search,
    });
  }
}
