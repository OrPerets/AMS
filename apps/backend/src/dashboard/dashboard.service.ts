import { Injectable } from '@nestjs/common';
import { ActivitySeverity, InvoiceStatus, Prisma, Role as PrismaRole, TicketSeverity, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ActivityService } from '../activity/activity.service';

type DashboardFilter = {
  buildingId?: number;
  range?: string;
};

type TicketSnapshot = {
  id: number;
  status: TicketStatus;
  severity: TicketSeverity;
  slaDue: Date | null;
  createdAt: Date;
  unit: {
    buildingId: number;
    building: {
      name: string;
    };
  };
};

type InvoiceSnapshot = {
  id: number;
  amount: number;
  status: InvoiceStatus;
  createdAt: Date;
  resident: {
    id: number;
    user: {
      email: string;
    } | null;
    units: Array<{
      buildingId: number;
      building: {
        id: number;
        name: string;
      };
    }>;
  };
};

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

  async kpis(filter: { buildingId?: number }) {
    const ticketFilter: Prisma.TicketWhereInput = { status: { not: TicketStatus.RESOLVED } };
    if (filter.buildingId) {
      ticketFilter.unit = { buildingId: filter.buildingId };
    }
    const slaFilter: Prisma.TicketWhereInput = {
      status: { not: TicketStatus.RESOLVED },
      slaDue: { lt: new Date() },
    };
    if (filter.buildingId) {
      slaFilter.unit = { buildingId: filter.buildingId };
    }
    const invoiceFilter: Prisma.InvoiceWhereInput = { status: InvoiceStatus.UNPAID };
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

  async overview(filter: DashboardFilter) {
    const now = new Date();
    const selectedBuildingId = filter.buildingId;
    const range = filter.range ?? '30d';
    const rangeStart = this.getRangeStart(range, now);

    const buildingListPromise = this.prisma.building.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const buildingsPromise = this.prisma.building.findMany({
      where: selectedBuildingId ? { id: selectedBuildingId } : undefined,
      select: {
        id: true,
        name: true,
        address: true,
        managerName: true,
        units: {
          select: {
            id: true,
            residents: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const ticketsPromise = this.prisma.ticket.findMany({
      where: selectedBuildingId ? { unit: { buildingId: selectedBuildingId } } : undefined,
      select: {
        id: true,
        status: true,
        severity: true,
        slaDue: true,
        createdAt: true,
        unit: {
          select: {
            buildingId: true,
            building: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }) as Promise<TicketSnapshot[]>;

    const invoicesPromise = this.prisma.invoice.findMany({
      where: {
        ...(selectedBuildingId ? { resident: { units: { some: { buildingId: selectedBuildingId } } } } : {}),
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        resident: {
          select: {
            id: true,
            user: {
              select: {
                email: true,
              },
            },
            units: {
              select: {
                buildingId: true,
                building: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }) as Promise<InvoiceSnapshot[]>;

    const maintenancePromise = this.prisma.maintenanceSchedule.findMany({
      where: selectedBuildingId ? { buildingId: selectedBuildingId } : undefined,
      select: {
        id: true,
        title: true,
        priority: true,
        nextOccurrence: true,
        completionVerified: true,
        buildingId: true,
        building: {
          select: {
            name: true,
          },
        },
        assignedTo: {
          select: {
            email: true,
          },
        },
      },
      orderBy: [
        {
          nextOccurrence: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    const contractsPromise = this.prisma.contract.findMany({
      where: selectedBuildingId ? { buildingId: selectedBuildingId } : undefined,
      select: {
        id: true,
        title: true,
        endDate: true,
        buildingId: true,
        building: {
          select: {
            name: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    });

    const notificationsPromise = this.prisma.notification.findMany({
      where: selectedBuildingId ? { buildingId: selectedBuildingId } : undefined,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        read: true,
        createdAt: true,
        building: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 8,
    });

    const [buildingList, buildings, tickets, invoices, maintenanceSchedules, contracts, notifications, recentUsers, recentImpersonationEvents, userRoleCounts] =
      await Promise.all([
        buildingListPromise,
        buildingsPromise,
        ticketsPromise,
        invoicesPromise,
        maintenancePromise,
        contractsPromise,
        notificationsPromise,
        this.prisma.user.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            email: true,
            role: true,
            tenantId: true,
            phone: true,
            createdAt: true,
          },
          take: 8,
        }),
        this.prisma.impersonationEvent.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          take: 6,
        }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { _all: true },
        }),
      ]);

    const roleCounts = Object.values(PrismaRole).reduce(
      (acc, roleName) => ({ ...acc, [roleName]: 0 }),
      {} as Record<string, number>,
    );

    for (const entry of userRoleCounts) {
      roleCounts[entry.role] = entry._count._all;
    }

    const buildingMap = new Map(
      buildings.map((building) => [
        building.id,
        {
          buildingId: building.id,
          buildingName: building.name,
          address: building.address,
          managerName: building.managerName,
          totalUnits: building.units.length,
          occupiedUnits: building.units.filter((unit) => unit.residents.length > 0).length,
          vacantUnits: building.units.filter((unit) => unit.residents.length === 0).length,
          openTickets: 0,
          urgentTickets: 0,
          inProgressTickets: 0,
          slaBreaches: 0,
          unpaidAmount: 0,
          overdueInvoices: 0,
          upcomingMaintenance: 0,
          complianceExpiries: 0,
          lastManagerActivity: null as Date | null,
        },
      ]),
    );

    for (const ticket of tickets) {
      const summary = buildingMap.get(ticket.unit.buildingId);
      if (!summary) {
        continue;
      }

      if (ticket.status !== TicketStatus.RESOLVED) {
        summary.openTickets += 1;
      }
      if (ticket.status === TicketStatus.IN_PROGRESS || ticket.status === TicketStatus.ASSIGNED) {
        summary.inProgressTickets += 1;
      }
      if (ticket.status !== TicketStatus.RESOLVED && ticket.severity === TicketSeverity.URGENT) {
        summary.urgentTickets += 1;
      }
      if (ticket.status !== TicketStatus.RESOLVED && ticket.slaDue && ticket.slaDue < now) {
        summary.slaBreaches += 1;
      }
      if (!summary.lastManagerActivity || ticket.createdAt > summary.lastManagerActivity) {
        summary.lastManagerActivity = ticket.createdAt;
      }
    }

    for (const invoice of invoices) {
      const dueDate = this.getInvoiceDueDate(invoice.createdAt);
      const isOverdue = invoice.status === InvoiceStatus.UNPAID && dueDate < now;
      const relatedBuildings = invoice.resident.units.length ? invoice.resident.units : [];

      for (const unit of relatedBuildings) {
        const summary = buildingMap.get(unit.buildingId);
        if (!summary || invoice.status !== InvoiceStatus.UNPAID) {
          continue;
        }
        summary.unpaidAmount += invoice.amount;
        if (isOverdue) {
          summary.overdueInvoices += 1;
        }
        if (!summary.lastManagerActivity || invoice.createdAt > summary.lastManagerActivity) {
          summary.lastManagerActivity = invoice.createdAt;
        }
      }
    }

    for (const schedule of maintenanceSchedules) {
      const summary = buildingMap.get(schedule.buildingId);
      if (!summary) {
        continue;
      }
      const nextOccurrence = schedule.nextOccurrence;
      if (nextOccurrence && nextOccurrence >= now) {
        summary.upcomingMaintenance += 1;
      }
      if (nextOccurrence && (!summary.lastManagerActivity || nextOccurrence > summary.lastManagerActivity)) {
        summary.lastManagerActivity = nextOccurrence;
      }
    }

    for (const contract of contracts) {
      if (!contract.endDate) {
        continue;
      }
      const summary = buildingMap.get(contract.buildingId);
      if (!summary) {
        continue;
      }
      const daysLeft = (contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysLeft <= 30) {
        summary.complianceExpiries += 1;
      }
      if (!summary.lastManagerActivity || contract.endDate > summary.lastManagerActivity) {
        summary.lastManagerActivity = contract.endDate;
      }
    }

    for (const notification of notifications) {
      if (!notification.building) {
        continue;
      }
      const summary = Array.from(buildingMap.values()).find((item) => item.buildingName === notification.building?.name);
      if (summary && (!summary.lastManagerActivity || notification.createdAt > summary.lastManagerActivity)) {
        summary.lastManagerActivity = notification.createdAt;
      }
    }

    const buildingRiskList = Array.from(buildingMap.values())
      .map((summary) => ({
        ...summary,
        riskScore:
          summary.urgentTickets * 5 +
          summary.slaBreaches * 4 +
          summary.overdueInvoices * 3 +
          summary.complianceExpiries * 2 +
          Math.round(summary.unpaidAmount / 1000),
      }))
      .sort((a, b) => b.riskScore - a.riskScore || b.openTickets - a.openTickets)
      .slice(0, 8)
      .map((summary) => ({
        ...summary,
        lastManagerActivity: summary.lastManagerActivity?.toISOString() ?? null,
      }));

    const unresolvedTickets = tickets.filter((ticket) => ticket.status !== TicketStatus.RESOLVED);
    const unpaidInvoices = invoices.filter((invoice) => invoice.status === InvoiceStatus.UNPAID);
    const overdueInvoices = unpaidInvoices.filter((invoice) => this.getInvoiceDueDate(invoice.createdAt) < now);
    const occupiedUnits = buildings.reduce((sum, building) => sum + building.units.filter((unit) => unit.residents.length > 0).length, 0);
    const vacantUnits = buildings.reduce((sum, building) => sum + building.units.filter((unit) => unit.residents.length === 0).length, 0);
    const urgentTickets = unresolvedTickets.filter((ticket) => ticket.severity === TicketSeverity.URGENT);
    const slaBreaches = unresolvedTickets.filter((ticket) => ticket.slaDue && ticket.slaDue < now);
    const resolvedToday = tickets.filter(
      (ticket) =>
        ticket.status === TicketStatus.RESOLVED &&
        ticket.createdAt >= new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    ).length;

    const openTicketsByStatus = tickets.reduce(
      (acc, ticket) => {
        acc[ticket.status] += 1;
        return acc;
      },
      {
        OPEN: 0,
        ASSIGNED: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
      } as Record<TicketStatus, number>,
    );

    const buildingLoad = Array.from(buildingMap.values())
      .map((summary) => ({
        buildingId: summary.buildingId,
        buildingName: summary.buildingName,
        openTickets: summary.openTickets,
        urgentTickets: summary.urgentTickets,
        inProgressTickets: summary.inProgressTickets,
        slaBreaches: summary.slaBreaches,
      }))
      .sort((a, b) => b.urgentTickets - a.urgentTickets || b.openTickets - a.openTickets)
      .slice(0, 6);

    const upcomingMaintenance = maintenanceSchedules
      .filter((schedule) => schedule.nextOccurrence && schedule.nextOccurrence >= now)
      .slice(0, 6)
      .map((schedule) => ({
        id: schedule.id,
        title: schedule.title,
        priority: schedule.priority,
        nextOccurrence: schedule.nextOccurrence?.toISOString() ?? null,
        buildingName: schedule.building.name,
        assignedTo: schedule.assignedTo?.email ?? null,
      }));

    const overdueMaintenance = maintenanceSchedules.filter(
      (schedule) => schedule.nextOccurrence && schedule.nextOccurrence < now && !schedule.completionVerified,
    );
    const maintenanceDueToday = maintenanceSchedules.filter(
      (schedule) =>
        schedule.nextOccurrence &&
        schedule.nextOccurrence >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) &&
        schedule.nextOccurrence < new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    );
    const maintenanceDueThisWeek = maintenanceSchedules.filter(
      (schedule) =>
        schedule.nextOccurrence &&
        schedule.nextOccurrence >= now &&
        schedule.nextOccurrence < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    );

    const expiringContracts = contracts
      .filter((contract) => contract.endDate && contract.endDate >= now && contract.endDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000))
      .slice(0, 4)
      .map((contract) => ({
        id: contract.id,
        title: contract.title,
        buildingName: contract.building.name,
        supplierName: contract.supplier?.name ?? null,
        endDate: contract.endDate?.toISOString() ?? null,
      }));

    const attentionItems = [
      {
        id: 'urgent-building',
        tone: 'danger',
        title: 'בניינים עם עומס חריג',
        value: buildingRiskList[0]?.buildingName ?? 'ללא חריגות',
        description:
          buildingRiskList[0]
            ? `${buildingRiskList[0].urgentTickets} קריאות דחופות ו-${buildingRiskList[0].slaBreaches} חריגות SLA`
            : 'אין כרגע בניין עם עומס חריג.',
        ctaLabel: 'פתח קריאות',
        ctaHref: '/tickets',
      },
      {
        id: 'collections',
        tone: overdueInvoices.length ? 'warning' : 'calm',
        title: 'גבייה בפיגור',
        value: `${this.formatCurrency(overdueInvoices.reduce((sum, invoice) => sum + invoice.amount, 0))}`,
        description: `${overdueInvoices.length} חשבוניות באיחור דורשות טיפול.`,
        ctaLabel: 'פתח תשלומים',
        ctaHref: '/payments',
      },
      {
        id: 'contracts',
        tone: expiringContracts.length ? 'warning' : 'calm',
        title: 'חוזים קרובים לפקיעה',
        value: `${expiringContracts.length}`,
        description: expiringContracts.length ? 'נדרשת בדיקה או חידוש ב-30 הימים הקרובים.' : 'אין חוזים קרובים לפקיעה.',
        ctaLabel: 'בדוק מסמכים',
        ctaHref: '/documents',
      },
      {
        id: 'maintenance',
        tone: overdueMaintenance.length ? 'danger' : 'calm',
        title: 'תחזוקה שפספסה יעד',
        value: `${overdueMaintenance.length}`,
        description: overdueMaintenance.length ? 'פעולות תחזוקה שחלף מועדן ולא אומתו.' : 'אין תחזוקה חריגה כרגע.',
        ctaLabel: 'לוח תחזוקה',
        ctaHref: '/maintenance',
      },
      {
        id: 'emergency',
        tone: urgentTickets.length ? 'danger' : 'calm',
        title: 'אירועים דחופים פתוחים',
        value: `${urgentTickets.length}`,
        description: urgentTickets.length ? 'קריאות בעדיפות בהולה עדיין פתוחות.' : 'אין אירועי חירום פתוחים.',
        ctaLabel: 'מרכז קריאות',
        ctaHref: '/tickets',
      },
    ];

    return {
      filters: {
        selectedBuildingId: selectedBuildingId ?? null,
        range,
        buildings: buildingList,
      },
      portfolioKpis: {
        openTickets: unresolvedTickets.length,
        urgentTickets: urgentTickets.length,
        slaBreaches: slaBreaches.length,
        unpaidBalance: unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        overdueInvoices: overdueInvoices.length,
        occupiedUnits,
        vacantUnits,
        resolvedToday,
      },
      attentionItems,
      ticketTrends: {
        monthlyTrend: await this.buildMonthlyTrend(selectedBuildingId ? { unit: { buildingId: selectedBuildingId } } : {}, rangeStart, now),
        ticketsByStatus: openTicketsByStatus,
        buildingLoad,
      },
      collectionsSummary: {
        unpaidBalance: unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        overdueInvoices: overdueInvoices.length,
        pendingInvoices: unpaidInvoices.length - overdueInvoices.length,
        topDebtors: this.buildTopDebtors(unpaidInvoices, now),
      },
      maintenanceSummary: {
        overdue: overdueMaintenance.length,
        dueToday: maintenanceDueToday.length,
        dueThisWeek: maintenanceDueThisWeek.length,
        upcoming: upcomingMaintenance,
      },
      recentNotifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
        buildingName: notification.building?.name ?? null,
      })),
      buildingRiskList,
      systemAdmin: {
        stats: {
          totalUsers: await this.prisma.user.count(),
          totalBuildings: buildingList.length,
          openTickets: unresolvedTickets.length,
          unpaidInvoices: unpaidInvoices.length,
          activeTechs: await this.prisma.user.count({ where: { role: PrismaRole.TECH } }),
        },
        health: {
          database: 'connected',
          auth: 'healthy',
          notifications: 'healthy',
        },
        roleCounts,
        users: recentUsers,
        recentImpersonationEvents,
      },
    };
  }

  async charts(filter: { buildingId?: number }) {
    const where: Prisma.TicketWhereInput = {};
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

  async exportInvoices(filter: { buildingId?: number; userId?: number }) {
    const where: Prisma.InvoiceWhereInput = {};
    if (filter.buildingId) {
      where.resident = { units: { some: { buildingId: filter.buildingId } } };
    }
    const invoices = await this.prisma.invoice.findMany({ where });
    const lines = ['id,residentId,amount,status', ...invoices.map((invoice) => `${invoice.id},${invoice.residentId},${invoice.amount},${invoice.status}`)];
    await this.activity.log({
      userId: filter.userId,
      buildingId: filter.buildingId ?? null,
      entityType: 'EXPORT',
      action: 'DASHBOARD_EXPORT',
      summary: 'בוצע יצוא נתוני דשבורד ל-CSV.',
      severity: ActivitySeverity.WARNING,
      metadata: { scope: 'dashboard', buildingId: filter.buildingId ?? null },
    });
    return lines.join('\n');
  }

  private getRangeStart(range: string, now: Date) {
    const normalized = range.toLowerCase();
    if (normalized === '7d') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (normalized === '90d') {
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  private getInvoiceDueDate(createdAt: Date) {
    return new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  private formatCurrency(amount: number) {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private buildTopDebtors(invoices: InvoiceSnapshot[], now: Date) {
    const byResident = new Map<
      number,
      {
        residentId: number;
        residentName: string;
        amount: number;
        overdueCount: number;
      }
    >();

    for (const invoice of invoices) {
      const existing = byResident.get(invoice.resident.id) ?? {
        residentId: invoice.resident.id,
        residentName: invoice.resident.user?.email ?? `Resident #${invoice.resident.id}`,
        amount: 0,
        overdueCount: 0,
      };

      existing.amount += invoice.amount;
      if (this.getInvoiceDueDate(invoice.createdAt) < now) {
        existing.overdueCount += 1;
      }
      byResident.set(invoice.resident.id, existing);
    }

    return Array.from(byResident.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  private async buildMonthlyTrend(where: Prisma.TicketWhereInput, startDate?: Date, endDate?: Date) {
    const results: { month: string; count: number }[] = [];
    const now = endDate ?? new Date();
    const effectiveStart = startDate ?? new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const months = Math.max(
      1,
      (now.getFullYear() - effectiveStart.getFullYear()) * 12 + (now.getMonth() - effectiveStart.getMonth()) + 1,
    );

    for (let index = months - 1; index >= 0; index -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1);
      const count = await this.prisma.ticket.count({
        where: { ...where, createdAt: { gte: start, lt: end } },
      });
      results.push({ month: start.toISOString().slice(0, 7), count });
    }

    return results;
  }
}
