import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  async getCalendar(input: { start: string; end: string; buildingId?: number }) {
    const start = new Date(input.start);
    const end = new Date(input.end);
    const buildingWhere = input.buildingId ? { buildingId: input.buildingId } : {};

    const [schedules, maintenance, contracts, invoices, notifications, votes] = await Promise.all([
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
    ]);

    return [
      ...schedules.map((item) => ({
        id: `schedule-${item.id}`,
        type: 'SCHEDULE',
        date: item.date.toISOString(),
        title: item.title || `לוח זמנים #${item.id}`,
        description: item.description || `${item.tasks.length} משימות`,
        buildingName: item.building?.name ?? 'ללא בניין',
        priority: item.status,
      })),
      ...maintenance.map((item) => ({
        id: `maintenance-${item.id}`,
        type: 'MAINTENANCE',
        date: item.nextOccurrence?.toISOString(),
        title: item.title,
        description: item.assignedTo?.email ?? item.description ?? '',
        buildingName: item.building.name,
        priority: item.priority,
      })),
      ...contracts.map((item) => ({
        id: `contract-${item.id}`,
        type: 'CONTRACT',
        date: item.endDate?.toISOString(),
        title: `חידוש חוזה: ${item.title}`,
        description: item.supplier?.name ?? item.owner?.email ?? '',
        buildingName: item.building.name,
        priority: item.approvalStatus,
      })),
      ...invoices.map((item) => ({
        id: `invoice-${item.id}`,
        type: 'INVOICE',
        date: item.dueDate?.toISOString(),
        title: `מועד פירעון חשבונית #${item.id}`,
        description: item.resident.user.email,
        buildingName: item.resident.units[0]?.building.name ?? 'ללא בניין',
        priority: item.status,
      })),
      ...notifications.map((item) => ({
        id: `notification-${item.id}`,
        type: 'NOTICE',
        date: item.createdAt.toISOString(),
        title: item.title,
        description: item.message,
        buildingName: item.building?.name ?? 'כללי',
        priority: item.type ?? 'NOTICE',
      })),
      ...votes.map((item) => ({
        id: `vote-${item.id}`,
        type: 'VOTE',
        date: item.endDate.toISOString(),
        title: `מועד סיום הצבעה: ${item.title}`,
        description: item.question,
        buildingName: item.building.name,
        priority: item.isClosed ? 'CLOSED' : 'OPEN',
      })),
    ]
      .filter((item) => item.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
  }
}
