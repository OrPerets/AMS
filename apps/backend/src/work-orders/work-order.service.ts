import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) {}

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
      include: { ticket: true },
    });
  }

  async start(id: number) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) throw new Error('Work order not found');
    await this.prisma.ticket.update({ where: { id: order.ticketId }, data: { status: TicketStatus.IN_PROGRESS } });
    return { ok: true };
  }

  async complete(id: number) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order) throw new Error('Work order not found');
    await this.prisma.ticket.update({ where: { id: order.ticketId }, data: { status: TicketStatus.RESOLVED } });
    return { ok: true };
  }
}
