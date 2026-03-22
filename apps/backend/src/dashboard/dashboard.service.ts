import { Injectable } from '@nestjs/common';
import {
  ActivitySeverity,
  ApprovalTaskStatus,
  InvoiceStatus,
  Prisma,
  Role as PrismaRole,
  TicketSeverity,
  TicketStatus,
  WorkOrderStatus,
} from '@prisma/client';
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
  assignedToId: number | null;
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

type RangeKey = '7d' | '30d' | '90d';

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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedBuildingId = filter.buildingId;
    const range = this.normalizeRange(filter.range);
    const rangeStart = this.getRangeStart(range, now);
    const rangeLabel = this.getRangeLabel(range);
    const rangeDays = this.getRangeDays(range);
    const rangeEnd = new Date(now.getTime() + rangeDays * 24 * 60 * 60 * 1000);

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
        assignedToId: true,
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
      where: {
        ...(selectedBuildingId ? { buildingId: selectedBuildingId } : {}),
        createdAt: { gte: rangeStart },
      },
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

    const directResolutionEventsPromise = this.prisma.activityLog.findMany({
      where: {
        ...(selectedBuildingId ? { buildingId: selectedBuildingId } : {}),
        action: 'TICKET_STATUS_CHANGED',
        createdAt: { gte: rangeStart },
      },
      select: {
        entityId: true,
        createdAt: true,
        metadata: true,
      },
    });

    const completedWorkOrdersPromise = this.prisma.workOrder.findMany({
      where: {
        status: WorkOrderStatus.COMPLETED,
        completedAt: { gte: rangeStart },
        ...(selectedBuildingId ? { ticket: { unit: { buildingId: selectedBuildingId } } } : {}),
      },
      select: {
        ticketId: true,
        completedAt: true,
      },
    });

    const [techOpenGroups, techUrgentGroups, techBreachGroups, techUsers, activityUsersInRange, activityEventsInRange, pendingApprovals] =
      await Promise.all([
        this.prisma.ticket.groupBy({
          by: ['assignedToId'],
          where: {
            status: { not: TicketStatus.RESOLVED },
            ...(selectedBuildingId ? { unit: { buildingId: selectedBuildingId } } : {}),
          },
          _count: { _all: true },
        }),
        this.prisma.ticket.groupBy({
          by: ['assignedToId'],
          where: {
            status: { not: TicketStatus.RESOLVED },
            severity: TicketSeverity.URGENT,
            ...(selectedBuildingId ? { unit: { buildingId: selectedBuildingId } } : {}),
          },
          _count: { _all: true },
        }),
        this.prisma.ticket.groupBy({
          by: ['assignedToId'],
          where: {
            status: { not: TicketStatus.RESOLVED },
            slaDue: { lt: now },
            ...(selectedBuildingId ? { unit: { buildingId: selectedBuildingId } } : {}),
          },
          _count: { _all: true },
        }),
        this.prisma.user.findMany({
          where: { role: PrismaRole.TECH },
          select: { id: true, email: true },
          orderBy: { email: 'asc' },
        }),
        this.prisma.activityLog.groupBy({
          by: ['userId'],
          where: {
            createdAt: { gte: rangeStart },
            userId: { not: null },
            ...(selectedBuildingId ? { buildingId: selectedBuildingId } : {}),
          },
          _count: { _all: true },
        }),
        this.prisma.activityLog.count({
          where: {
            createdAt: { gte: rangeStart },
            ...(selectedBuildingId ? { buildingId: selectedBuildingId } : {}),
          },
        }),
        this.prisma.approvalTask.count({
          where: {
            status: ApprovalTaskStatus.PENDING,
            ...(selectedBuildingId ? { buildingId: selectedBuildingId } : {}),
          },
        }),
      ]);

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

    const [directResolutionEvents, completedWorkOrders] = await Promise.all([
      directResolutionEventsPromise,
      completedWorkOrdersPromise,
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
    const createdInRange = tickets.filter((ticket) => ticket.createdAt >= rangeStart).length;
    const resolvedInRangeIds = new Set<number>();
    const resolvedTodayIds = new Set<number>();

    for (const event of directResolutionEvents) {
      const status = this.readMetadataValue(event.metadata, 'status');
      if (status !== TicketStatus.RESOLVED || !event.entityId) {
        continue;
      }
      resolvedInRangeIds.add(event.entityId);
      if (event.createdAt >= todayStart) {
        resolvedTodayIds.add(event.entityId);
      }
    }

    for (const order of completedWorkOrders) {
      resolvedInRangeIds.add(order.ticketId);
      if (order.completedAt && order.completedAt >= todayStart) {
        resolvedTodayIds.add(order.ticketId);
      }
    }

    const resolvedToday = resolvedTodayIds.size;
    const resolvedInRange = resolvedInRangeIds.size;

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
      .filter(
        (schedule) =>
          schedule.nextOccurrence &&
          schedule.nextOccurrence >= now &&
          schedule.nextOccurrence <= rangeEnd,
      )
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
    const maintenanceDueInRange = maintenanceSchedules.filter(
      (schedule) =>
        schedule.nextOccurrence &&
        schedule.nextOccurrence >= now &&
        schedule.nextOccurrence <= rangeEnd,
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

    const techLoadMap = new Map<
      number | null,
      {
        assignedOpenTickets: number;
        urgentOpenTickets: number;
        slaBreaches: number;
      }
    >();

    for (const row of techOpenGroups) {
      techLoadMap.set(row.assignedToId, {
        assignedOpenTickets: row._count._all,
        urgentOpenTickets: 0,
        slaBreaches: 0,
      });
    }

    for (const row of techUrgentGroups) {
      const current = techLoadMap.get(row.assignedToId) ?? {
        assignedOpenTickets: 0,
        urgentOpenTickets: 0,
        slaBreaches: 0,
      };
      current.urgentOpenTickets = row._count._all;
      techLoadMap.set(row.assignedToId, current);
    }

    for (const row of techBreachGroups) {
      const current = techLoadMap.get(row.assignedToId) ?? {
        assignedOpenTickets: 0,
        urgentOpenTickets: 0,
        slaBreaches: 0,
      };
      current.slaBreaches = row._count._all;
      techLoadMap.set(row.assignedToId, current);
    }

    const techWorkload = techUsers
      .map((user) => {
        const metrics = techLoadMap.get(user.id) ?? {
          assignedOpenTickets: 0,
          urgentOpenTickets: 0,
          slaBreaches: 0,
        };
        const loadScore = metrics.assignedOpenTickets + metrics.urgentOpenTickets * 2 + metrics.slaBreaches * 2;
        return {
          techId: user.id,
          email: user.email,
          assignedOpenTickets: metrics.assignedOpenTickets,
          urgentOpenTickets: metrics.urgentOpenTickets,
          slaBreaches: metrics.slaBreaches,
          loadBand: loadScore >= 8 ? 'critical' : loadScore >= 4 ? 'busy' : 'balanced',
        };
      })
      .sort(
        (a, b) =>
          b.assignedOpenTickets - a.assignedOpenTickets ||
          b.urgentOpenTickets - a.urgentOpenTickets ||
          a.email.localeCompare(b.email),
      );

    const bottlenecks = [
      {
        id: 'sla',
        title: 'חריגות SLA',
        count: slaBreaches.length,
        tone: slaBreaches.length > 0 ? 'danger' : 'calm',
        description: slaBreaches.length > 0 ? 'קריאות שחרגו מחלון הטיפול ודורשות הסלמה.' : 'אין כרגע חריגות SLA פתוחות.',
        href: '/tickets',
      },
      {
        id: 'unassigned',
        title: 'קריאות ללא שיוך',
        count: unresolvedTickets.filter((ticket) => !ticket.assignedToId).length,
        tone: unresolvedTickets.some((ticket) => !ticket.assignedToId) ? 'warning' : 'calm',
        description: 'קריאות שעדיין לא שויכו לטכנאי או לספק ומאטות את הטיפול.',
        href: '/tickets',
      },
      {
        id: 'approvals',
        title: 'אישורים ממתינים',
        count: pendingApprovals,
        tone: pendingApprovals > 0 ? 'warning' : 'calm',
        description: 'עבודות והחלטות רגישות שמחכות לאישור מנהלי.',
        href: '/admin/approvals',
      },
      {
        id: 'collections',
        title: 'חשבוניות בפיגור',
        count: overdueInvoices.length,
        tone: overdueInvoices.length > 0 ? 'danger' : 'calm',
        description: 'חובות שדורשים טיפול גבייה כדי לא לפגוע בתזרים.',
        href: '/payments',
      },
    ];

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
        rangeLabel,
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
        resolvedInRange,
        createdInRange,
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
        dueInRange: maintenanceDueInRange.length,
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
          activeUsersInRange: activityUsersInRange.length,
          activityEventsInRange,
          pendingApprovals,
        },
        health: {
          uptime: {
            status: 'healthy',
            label: 'זמן פעילות',
            value: this.formatDuration(Math.floor(process.uptime())),
            description: 'משך הזמן שה-API רץ ברצף ללא אתחול.',
          },
          api: {
            status: 'healthy',
            label: 'ממשק API',
            value: 'פעיל',
            description: 'שאילתות הדשבורד והמסד חזרו בהצלחה בטעינה הנוכחית.',
          },
          queue: {
            status: pendingApprovals > 0 ? 'warning' : 'healthy',
            label: 'תור אישורים',
            value: pendingApprovals > 0 ? `${pendingApprovals} ממתינים` : 'נקי',
            description:
              pendingApprovals > 0 ? 'יש משימות שמחכות לאישור ומעכבות ביצוע.' : 'אין כרגע צווארי בקבוק בתור האישורים.',
          },
          usage: {
            status: activityUsersInRange.length > 0 ? 'healthy' : 'warning',
            label: 'שימוש פעיל',
            value: `${activityUsersInRange.length} משתמשים / ${activityEventsInRange} אירועים`,
            description: `פעילות שנרשמה ב-${rangeLabel.toLowerCase()}.`,
          },
        },
        roleCounts,
        users: recentUsers,
        recentImpersonationEvents,
        techWorkload,
        bottlenecks,
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

  private normalizeRange(range?: string): RangeKey {
    const normalized = range?.toLowerCase();
    if (normalized === '7d' || normalized === '30d' || normalized === '90d') {
      return normalized;
    }
    return '30d';
  }

  private getRangeStart(range: RangeKey, now: Date) {
    if (range === '7d') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (range === '90d') {
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  private getRangeDays(range: RangeKey) {
    if (range === '7d') return 7;
    if (range === '90d') return 90;
    return 30;
  }

  private getRangeLabel(range: RangeKey) {
    if (range === '7d') return '7 הימים האחרונים';
    if (range === '90d') return '90 הימים האחרונים';
    return '30 הימים האחרונים';
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

  private formatDuration(totalSeconds: number) {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  private readMetadataValue(metadata: Prisma.JsonValue | null, key: string) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : null;
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
