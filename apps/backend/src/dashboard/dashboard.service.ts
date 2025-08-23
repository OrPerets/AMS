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
