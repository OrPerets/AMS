import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/v1/work-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrderController {
  constructor(private orders: WorkOrderService) {}

  @Get('today')
  @Roles(Role.TECH)
  listToday(@Query('supplierId') supplierId: string) {
    return this.orders.listTodayForSupplier(+supplierId);
  }
}
