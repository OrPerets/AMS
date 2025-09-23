import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateWorkOrderCostDto } from './dto/update-work-order-cost.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UpdateWorkOrderPhotosDto } from './dto/update-work-order-photos.dto';
import { ApproveWorkOrderDto } from './dto/approve-work-order.dto';
import { WorkOrderReportQueryDto } from './dto/work-order-report-query.dto';

@Controller('api/v1/work-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrderController {
  constructor(private orders: WorkOrderService) {}

  private parseQuery(query: WorkOrderReportQueryDto) {
    const parsed: WorkOrderReportQueryDto = {};
    if (query.start) {
      parsed.start = query.start;
    }
    if (query.end) {
      parsed.end = query.end;
    }
    if (query.supplierId) {
      const supplierId = Number.parseInt(query.supplierId as unknown as string, 10);
      if (!Number.isNaN(supplierId)) {
        parsed.supplierId = supplierId;
      }
    }
    if (query.status) {
      parsed.status = query.status;
    }
    return parsed;
  }

  @Get()
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  list(@Query() query: WorkOrderReportQueryDto) {
    return this.orders.findAll(this.parseQuery(query));
  }

  @Get('reports/summary')
  @Roles(Role.ADMIN, Role.PM)
  summary(@Query() query: WorkOrderReportQueryDto) {
    return this.orders.getReport(this.parseQuery(query));
  }

  @Get('today')
  @Roles(Role.TECH)
  listToday(@Query('supplierId') supplierId: string) {
    return this.orders.listTodayForSupplier(+supplierId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  getOne(@Param('id') id: string) {
    return this.orders.findOne(+id);
  }

  @Patch(':id/costs')
  @Roles(Role.ADMIN, Role.PM)
  updateCosts(@Param('id') id: string, @Body() dto: UpdateWorkOrderCostDto) {
    return this.orders.updateCosts(+id, dto);
  }

  @Patch(':id/photos')
  @Roles(Role.TECH)
  updatePhotos(@Param('id') id: string, @Body() dto: UpdateWorkOrderPhotosDto) {
    return this.orders.updatePhotos(+id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateWorkOrderStatusDto) {
    return this.orders.updateStatus(+id, dto);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.PM)
  approve(@Param('id') id: string, @Body() dto: ApproveWorkOrderDto) {
    return this.orders.approve(+id, dto);
  }

  @Patch(':id/start')
  @Roles(Role.TECH)
  start(@Param('id') id: string) {
    return this.orders.start(+id);
  }

  @Patch(':id/complete')
  @Roles(Role.TECH)
  complete(@Param('id') id: string) {
    return this.orders.complete(+id);
  }
}
