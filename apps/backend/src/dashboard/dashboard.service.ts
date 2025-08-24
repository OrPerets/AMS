import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TicketStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async kpis(filter: { buildingId?: number }) {
    const ticketFilter: any = { status: { not: TicketStatus.RESOLVED } };
    if (filter.buildingId) {
      ticketFilter.unit = { buildingId: filter.buildingId };
    }
    const slaFilter: any = {
      status: { not: TicketStatus.RESOLVED },
      slaDue: { lt: new Date() },
    };
    if (filter.buildingId) {
      slaFilter.unit = { buildingId: filter.buildingId };
    }
    const invoiceFilter: any = { status: InvoiceStatus.UNPAID };
    if (filter.buildingId) {
      invoiceFilter.resident = { units: { some: { buildingId: filter.buildingId } } };
    }
    const [openTickets, slaBreaches, unpaidInvoices] = await Promise.all([
      this.prisma.ticket.count({ where: ticketFilter }),
      this.prisma.ticket.count({ where: slaFilter }),
      this.prisma.invoice.count({ where: invoiceFilter }),
    ]);
    return { openTickets, slaBreaches, unpaidInvoices };
  }

  async charts(filter: { buildingId?: number }) {
    const where: any = {};
    if (filter.buildingId) {
      where.unit = { buildingId: filter.buildingId };
    }

    const [statusGroups, techGroups, monthlyCounts] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ['status'],
        _count: { _all: true },
        where,
      }),
      this.prisma.ticket.groupBy({
        by: ['assignedToId'],
        _count: { _all: true },
        where: { ...where, status: { not: TicketStatus.RESOLVED } },
      }),
      this.buildMonthlyTrend(where),
    ]);

    const ticketsByStatus = statusGroups.reduce((acc, cur) => {
      acc[cur.status] = cur._count._all;
      return acc;
    }, {} as Record<string, number>);

    const techIds = techGroups.map((g) => g.assignedToId).filter((id): id is number => id !== null);
    const users = await this.prisma.user.findMany({
      where: { id: { in: techIds } },
      select: { id: true, email: true },
    });
    const techWorkload = techGroups.map((g) => ({
      techId: g.assignedToId,
      email: users.find((u) => u.id === g.assignedToId)?.email || 'unassigned',
      count: g._count._all,
    }));

    return {
      ticketsByStatus,
      monthlyTrend: monthlyCounts,
      techWorkload,
    };
  }

  private async buildMonthlyTrend(where: any) {
    const results: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await this.prisma.ticket.count({
        where: { ...where, createdAt: { gte: start, lt: end } },
      });
      results.push({ month: start.toISOString().slice(0, 7), count });
    }
    return results;
  }

  async exportInvoices(filter: { buildingId?: number }) {
    const where: any = {};
    if (filter.buildingId) {
      where.resident = { units: { some: { buildingId: filter.buildingId } } };
    }
    const invoices = await this.prisma.invoice.findMany({ where });
    const lines = [
      'id,residentId,amount,status',
      ...invoices.map((i) => `${i.id},${i.residentId},${i.amount},${i.status}`),
    ];
    return lines.join('\n');
  }
}
