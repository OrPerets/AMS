import { Injectable } from '@nestjs/common';
import { Prisma, TicketStatus, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PhotoService } from '../tickets/photo.service';
import { UpdateWorkOrderCostDto } from './dto/update-work-order-cost.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UpdateWorkOrderPhotosDto } from './dto/update-work-order-photos.dto';
import { ApproveWorkOrderDto } from './dto/approve-work-order.dto';
import { WorkOrderReportQueryDto } from './dto/work-order-report-query.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class WorkOrderService {
  private readonly include = {
    ticket: {
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
    },
    supplier: true,
    approvedBy: true,
  } as const;

  constructor(
    private prisma: PrismaService,
    private photos: PhotoService,
    private activity: ActivityService,
  ) {}

  private calculateTotalCost(costs: {
    laborCost?: number | null;
    materialCost?: number | null;
    equipmentCost?: number | null;
    tax?: number | null;
  }) {
    return (costs.laborCost ?? 0) + (costs.materialCost ?? 0) + (costs.equipmentCost ?? 0) + (costs.tax ?? 0);
  }

  listTodayForSupplier(supplierId: number) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.workOrder.findMany({
      where: {
        supplierId,
        createdAt: { gte: start, lte: end },
      },
      include: this.include,
      orderBy: { createdAt: 'asc' },
    });
  }

  findAll(query: WorkOrderReportQueryDto) {
    const where: Prisma.WorkOrderWhereInput = {};
    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.start || query.end) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.start) {
        createdAt.gte = new Date(query.start);
      }
      if (query.end) {
        createdAt.lte = new Date(query.end);
      }
      where.createdAt = createdAt;
    }

    return this.prisma.workOrder.findMany({
      where,
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.workOrder.findUnique({ where: { id }, include: this.include });
  }

  async updateCosts(id: number, dto: UpdateWorkOrderCostDto) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) {
      throw new Error('Work order not found');
    }

    const totals = this.calculateTotalCost({
      laborCost: dto.laborCost ?? order.laborCost,
      materialCost: dto.materialCost ?? order.materialCost,
      equipmentCost: dto.equipmentCost ?? order.equipmentCost,
      tax: dto.tax ?? order.tax,
    });

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        laborCost: dto.laborCost,
        materialCost: dto.materialCost,
        equipmentCost: dto.equipmentCost,
        tax: dto.tax,
        costEstimate: dto.costEstimate,
        costNotes: dto.costNotes,
        totalCost: totals,
      },
      include: this.include,
    });
    await this.activity.log({
      buildingId: updated.ticket.unit.building.id,
      entityType: 'WORK_ORDER',
      entityId: updated.id,
      action: 'WORK_ORDER_COST_UPDATED',
      summary: `עודכנו עלויות להזמנת עבודה #${updated.id}.`,
      metadata: { totalCost: updated.totalCost, supplierId: updated.supplierId },
    });
    return updated;
  }

  async updateStatus(id: number, dto: UpdateWorkOrderStatusDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.workOrder.findUnique({ where: { id } });
      if (!order) {
        throw new Error('Work order not found');
      }

      const data: Prisma.WorkOrderUpdateInput = { status: dto.status };

      if (dto.scheduledStart) {
        data.scheduledStart = new Date(dto.scheduledStart);
      } else if (dto.status === WorkOrderStatus.IN_PROGRESS && !order.scheduledStart) {
        data.scheduledStart = new Date();
      }

      if (dto.scheduledEnd) {
        data.scheduledEnd = new Date(dto.scheduledEnd);
      }

      if (dto.status === WorkOrderStatus.COMPLETED) {
        data.completedAt = dto.completedAt ? new Date(dto.completedAt) : new Date();
      } else if (dto.completedAt) {
        data.completedAt = new Date(dto.completedAt);
      } else {
        data.completedAt = null;
      }

      if (dto.notes !== undefined) {
        data.costNotes = dto.notes;
      }

      const updated = await tx.workOrder.update({
        where: { id },
        data,
        include: this.include,
      });

      if (dto.status === WorkOrderStatus.IN_PROGRESS) {
        await tx.ticket.update({ where: { id: order.ticketId }, data: { status: TicketStatus.IN_PROGRESS } });
      } else if (dto.status === WorkOrderStatus.COMPLETED) {
        await tx.ticket.update({ where: { id: order.ticketId }, data: { status: TicketStatus.RESOLVED } });
      }

      return updated;
    });
    await this.logStatusUpdate(updated);
    return updated;
  }

  async logStatusUpdate(order: Awaited<ReturnType<WorkOrderService['findOne']>>) {
    if (!order) return;
    await this.activity.log({
      userId: order.approvedById ?? undefined,
      buildingId: order.ticket.unit.building.id,
      entityType: 'WORK_ORDER',
      entityId: order.id,
      action: 'WORK_ORDER_STATUS_CHANGED',
      summary: `סטטוס הזמנת עבודה #${order.id} עודכן ל-${order.status}.`,
      metadata: { status: order.status, supplierId: order.supplierId },
    });
  }

  async updatePhotos(id: number, dto: UpdateWorkOrderPhotosDto, files?: Express.Multer.File[]) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) {
      throw new Error('Work order not found');
    }

    const current = order.photos ?? [];
    const uploadedPhotos = await Promise.all((files ?? []).map((file) => this.photos.upload(file)));
    const requestedPhotos = dto.photos ?? [];
    const nextPhotos = [...requestedPhotos, ...uploadedPhotos];
    const photos = dto.replace ? nextPhotos : Array.from(new Set([...current, ...nextPhotos]));

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: { photos },
      include: this.include,
    });
    await this.activity.log({
      buildingId: updated.ticket.unit.building.id,
      entityType: 'WORK_ORDER',
      entityId: updated.id,
      action: 'WORK_ORDER_PHOTOS_UPDATED',
      summary: `עודכנו תמונות להזמנת עבודה #${updated.id}.`,
      metadata: { photoCount: updated.photos.length },
    });
    return updated;
  }

  async approve(id: number, dto: ApproveWorkOrderDto) {
    const order = await this.prisma.$transaction(async (tx) => {
      const approvedAt = dto.approvedAt ? new Date(dto.approvedAt) : new Date();

      const updatedOrder = await tx.workOrder.update({
        where: { id },
        data: {
          status: WorkOrderStatus.APPROVED,
          approvedBy: { connect: { id: dto.approvedById } },
          approvedAt,
        },
        include: this.include,
      });

      await tx.ticket.update({ where: { id: updatedOrder.ticketId }, data: { status: TicketStatus.ASSIGNED } });

      return updatedOrder;
    });

    await this.activity.log({
      userId: dto.approvedById,
      buildingId: order.ticket.unit.building.id,
      entityType: 'WORK_ORDER',
      entityId: order.id,
      action: 'WORK_ORDER_APPROVED',
      summary: `הזמנת עבודה #${order.id} אושרה.`,
      metadata: { approvedAt: order.approvedAt?.toISOString() ?? null },
    });

    return order;
  }

  async getReport(query: WorkOrderReportQueryDto) {
    const orders = await this.findAll(query);

    const byStatus: Record<WorkOrderStatus, { count: number; totalCost: number }> = {
      [WorkOrderStatus.PENDING]: { count: 0, totalCost: 0 },
      [WorkOrderStatus.APPROVED]: { count: 0, totalCost: 0 },
      [WorkOrderStatus.IN_PROGRESS]: { count: 0, totalCost: 0 },
      [WorkOrderStatus.COMPLETED]: { count: 0, totalCost: 0 },
      [WorkOrderStatus.INVOICED]: { count: 0, totalCost: 0 },
    };

    const completionDurations: number[] = [];
    let totalCost = 0;

    for (const order of orders) {
      const statusTotals = byStatus[order.status];
      const computedTotal = order.totalCost ?? this.calculateTotalCost(order);
      statusTotals.count += 1;
      statusTotals.totalCost += computedTotal;
      totalCost += computedTotal;

      if (order.completedAt) {
        completionDurations.push(order.completedAt.getTime() - order.createdAt.getTime());
      }
    }

    const averageCompletionTimeHours = completionDurations.length
      ? completionDurations.reduce((sum, ms) => sum + ms, 0) / completionDurations.length / (1000 * 60 * 60)
      : null;

    return {
      filters: query,
      totals: {
        count: orders.length,
        totalCost,
        averageCompletionTimeHours,
      },
      byStatus,
      orders,
    };
  }

  async start(id: number) {
    return this.updateStatus(id, { status: WorkOrderStatus.IN_PROGRESS });
  }

  async complete(id: number) {
    return this.updateStatus(id, { status: WorkOrderStatus.COMPLETED });
  }
}
