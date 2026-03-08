import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  async getCalendar(input: { start: string; end: string; buildingId?: number; type?: string; status?: string; search?: string }) {
    const start = new Date(input.start);
    const end = new Date(input.end);
    const buildingWhere = input.buildingId ? { buildingId: input.buildingId } : {};

    const [schedules, maintenance, contracts, invoices, notifications, votes, suppliers] = await Promise.all([
      this.prisma.workSchedule.findMany({
        where: {
          date: { gte: start, lte: end },
          ...(input.buildingId ? { buildingId: input.buildingId } : {}),
        },
        include: { building: true, tasks: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.maintenanceSchedule.findMany({
        where: {
          nextOccurrence: { gte: start, lte: end },
          ...buildingWhere,
        },
        include: { building: true, assignedTo: true },
        orderBy: { nextOccurrence: 'asc' },
      }),
      this.prisma.contract.findMany({
        where: {
          endDate: { gte: start, lte: end },
          ...buildingWhere,
        },
        include: { building: true, supplier: true, owner: true },
        orderBy: { endDate: 'asc' },
      }),
      this.prisma.invoice.findMany({
        where: {
          dueDate: { gte: start, lte: end },
          ...(input.buildingId ? { resident: { units: { some: { buildingId: input.buildingId } } } } : {}),
        },
        include: {
          resident: {
            include: {
              user: true,
              units: { include: { building: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.notification.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          ...(input.buildingId ? { buildingId: input.buildingId } : {}),
        },
        include: { building: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vote.findMany({
        where: {
          endDate: { gte: start, lte: end },
          ...(input.buildingId ? { buildingId: input.buildingId } : {}),
        },
        include: { building: true },
        orderBy: { endDate: 'asc' },
      }),
      this.prisma.supplier.findMany({
        where: {
          isActive: true,
          OR: [
            { insuranceExpiry: { gte: start, lte: end } },
            { complianceDocumentExpiry: { gte: start, lte: end } },
          ],
        },
        orderBy: [{ insuranceExpiry: 'asc' }, { complianceDocumentExpiry: 'asc' }],
      }),
    ]);

    const items = [
      ...schedules.map((item) => ({
        id: `schedule-${item.id}`,
        type: 'SCHEDULE',
        date: item.date.toISOString(),
        title: item.title || `לוח זמנים #${item.id}`,
        description: item.description || `${item.tasks.length} משימות`,
        buildingName: item.building?.name ?? 'ללא בניין',
        priority: item.status,
        href: `/schedules/${item.id}`,
      })),
      ...maintenance.map((item) => ({
        id: `maintenance-${item.id}`,
        type: 'MAINTENANCE',
        date: item.nextOccurrence?.toISOString(),
        title: item.title,
        description: item.assignedTo?.email ?? item.description ?? '',
        buildingName: item.building.name,
        priority: item.priority,
        href: `/maintenance/${item.id}`,
      })),
      ...contracts.map((item) => ({
        id: `contract-${item.id}`,
        type: 'CONTRACT',
        date: (item.endDate ? new Date(item.endDate.getTime() - item.renewalReminderDays * 24 * 60 * 60 * 1000) : item.startDate).toISOString(),
        title: `חידוש חוזה: ${item.title}`,
        description: `${item.supplier?.name ?? item.owner?.email ?? ''}${item.endDate && item.endDate < new Date() ? ' · באיחור' : ''}`,
        buildingName: item.building.name,
        priority: item.endDate && item.endDate < new Date() ? 'OVERDUE' : item.approvalStatus,
        href: `/contracts`,
      })),
      ...invoices.map((item) => ({
        id: `invoice-${item.id}`,
        type: 'INVOICE',
        date: item.dueDate?.toISOString(),
        title: `מועד פירעון חשבונית #${item.id}`,
        description: item.resident.user.email,
        buildingName: item.resident.units[0]?.building.name ?? 'ללא בניין',
        priority: item.status,
        href: `/payments`,
      })),
      ...notifications.map((item) => ({
        id: `notification-${item.id}`,
        type: 'NOTICE',
        date: item.createdAt.toISOString(),
        title: item.title,
        description: item.message,
        buildingName: item.building?.name ?? 'כללי',
        priority: item.type ?? 'NOTICE',
        href: `/communications`,
      })),
      ...votes.map((item) => ({
        id: `vote-${item.id}`,
        type: 'VOTE',
        date: item.endDate.toISOString(),
        title: `מועד סיום הצבעה: ${item.title}`,
        description: item.question,
        buildingName: item.building.name,
        priority: item.isClosed ? 'CLOSED' : 'OPEN',
        href: `/votes/${item.id}`,
      })),
      ...suppliers.map((item) => ({
        id: `supplier-${item.id}-insurance`,
        type: 'COMPLIANCE',
        date: (item.insuranceExpiry ?? item.complianceDocumentExpiry)?.toISOString(),
        title: `תזכורת תאימות לספק ${item.name}`,
        description: item.insuranceExpiry && item.complianceDocumentExpiry
          ? 'תוקף ביטוח / מסמך תאימות'
          : item.insuranceExpiry
            ? 'תוקף ביטוח'
            : 'תוקף מסמך תאימות',
        buildingName: 'ספק חיצוני',
        priority: 'WARNING',
        href: `/vendors`,
      })),
    ]
      .filter((item) => item.date)
      .filter((item) => (input.type ? item.type === input.type : true))
      .filter((item) => (input.status ? String(item.priority).toUpperCase().includes(input.status.toUpperCase()) : true))
      .filter((item) =>
        input.search
          ? `${item.title} ${item.description} ${item.buildingName}`.toLowerCase().includes(input.search.toLowerCase())
          : true,
      )
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

    return {
      items,
      summary: {
        total: items.length,
        contracts: items.filter((item) => item.type === 'CONTRACT').length,
        compliance: items.filter((item) => item.type === 'COMPLIANCE').length,
        maintenance: items.filter((item) => item.type === 'MAINTENANCE').length,
        notices: items.filter((item) => item.type === 'NOTICE').length,
      },
    };
  }
}
