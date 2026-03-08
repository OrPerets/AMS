import { Injectable } from '@nestjs/common';
import { ApprovalTaskType, Prisma, Ticket, TicketSeverity, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PhotoService } from './photo.service';
import { NotificationService } from '../notifications/notification.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { ActivityService } from '../activity/activity.service';
import { ApprovalService } from '../approval/approval.service';

type TicketListFilter = {
  status?: TicketStatus;
  buildingId?: number;
  assigneeId?: number;
  severity?: TicketSeverity;
  search?: string;
  slaState?: string;
  sort?: string;
  queue?: string;
  limit?: number;
  category?: string;
  view?: string;
};

const ticketInclude = {
  comments: {
    include: {
      author: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  unit: {
    include: {
      building: true,
      residents: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  },
  assignedTo: {
    select: {
      id: true,
      email: true,
      role: true,
    },
  },
  workOrders: {
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  },
} satisfies Prisma.TicketInclude;

type TicketWithRelations = Prisma.TicketGetPayload<{ include: typeof ticketInclude }>;

type DispatchTicketItem = {
  id: number;
  status: TicketStatus;
  severity: TicketSeverity;
  createdAt: string;
  latestActivityAt: string;
  title: string;
  description: string;
  category: string;
  residentContact: string | null;
  residentName: string;
  building: {
    id: number;
    name: string;
  };
  unit: {
    id: number;
    number: string;
  };
  assignedTo: {
    id: number;
    email: string;
  } | null;
  commentCount: number;
  photoCount: number;
  hasPhotos: boolean;
  photos: string[];
  slaDue: string | null;
  slaState: string;
  workOrders: Array<{
    id: number;
    status: string;
    supplierName: string;
  }>;
  comments: Array<{
    id: number;
    content: string;
    createdAt: string;
    author: string;
    role: string | null;
  }>;
};

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    private photos: PhotoService,
    private notifications: NotificationService,
    private websocketGateway: WebSocketGateway,
    private activity: ActivityService,
    private approvals: ApprovalService,
  ) {}

  async create(data: Prisma.TicketCreateInput, files: Express.Multer.File[], description?: string, authorId?: number): Promise<Ticket> {
    const photoUrls = await Promise.all((files || []).map((file) => this.photos.upload(file)));
    const ticket = await this.prisma.ticket.create({
      data: { ...data, photos: photoUrls },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (description && authorId) {
      await this.prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          authorId,
          content: description,
        },
      });
    }

    const usersToNotify = await this.prisma.user.findMany({
      where: {
        OR: [{ role: 'ADMIN' }, { role: 'PM' }, { role: 'MASTER' }, ...(ticket.assignedToId ? [{ id: ticket.assignedToId }] : [])],
      },
      select: { id: true },
    });

    const userIds = usersToNotify.map((user) => user.id);
    this.websocketGateway.notifyNewTicket(ticket, userIds);

    await Promise.all(
      userIds.map((userId) =>
        this.notifications.create({
          tenantId: 1,
          userId,
          title: 'קריאה חדשה נפתחה',
          message: `קריאה מספר ${ticket.id} נפתחה בבניין ${ticket.unit.building.name}`,
          type: 'TICKET_CREATED',
          metadata: { ticketId: ticket.id, buildingId: ticket.unit.building.id },
        }),
      ),
    );

    await this.activity.log({
      userId: authorId,
      buildingId: ticket.unit.building.id,
      entityType: 'TICKET',
      entityId: ticket.id,
      action: 'TICKET_CREATED',
      summary: `נפתחה קריאה חדשה בבניין ${ticket.unit.building.name}.`,
      metadata: { severity: ticket.severity, status: ticket.status },
    });

    return ticket;
  }

  async findAll(filter: TicketListFilter) {
    const where = this.buildWhere(filter);
    const tickets = await this.prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: {
        createdAt: 'desc',
      },
      take: filter.view === 'dispatch' && filter.limit ? filter.limit * 4 : undefined,
    });

    if (filter.view === 'dispatch') {
      return this.buildDispatchResponse(tickets, filter);
    }

    return tickets;
  }

  async assign(id: number, dto: { assigneeId?: number; supplierId?: number; costEstimate?: number }) {
    if (dto.assigneeId) {
      const ticket = await this.prisma.ticket.update({
        where: { id },
        data: { assignedToId: dto.assigneeId, status: TicketStatus.ASSIGNED },
        include: ticketInclude,
      });
      await this.activity.log({
        userId: dto.assigneeId,
        buildingId: ticket.unit.building.id,
        entityType: 'TICKET',
        entityId: ticket.id,
        action: 'TICKET_ASSIGNED',
        summary: `הקריאה הוקצתה ל-${ticket.assignedTo?.email ?? `משתמש ${dto.assigneeId}`}.`,
        metadata: { assigneeId: dto.assigneeId },
      });
      return ticket;
    }
    if (dto.supplierId) {
      const workOrder = await this.prisma.workOrder.create({
        data: {
          ticket: { connect: { id } },
          supplier: { connect: { id: dto.supplierId } },
          costEstimate: dto.costEstimate,
        },
      });
      const ticket = await this.prisma.ticket.update({
        where: { id },
        data: { status: TicketStatus.ASSIGNED },
        include: ticketInclude,
      });
      await this.activity.log({
        buildingId: ticket.unit.building.id,
        entityType: 'TICKET',
        entityId: ticket.id,
        action: 'WORK_ORDER_CREATED',
        summary: `נוצרה הזמנת עבודה לספק #${dto.supplierId}.`,
        metadata: { supplierId: dto.supplierId, costEstimate: dto.costEstimate ?? null },
      });
      await this.approvals.createTask({
        type: ApprovalTaskType.WORK_ORDER_APPROVAL,
        entityType: 'WORK_ORDER',
        entityId: workOrder.id,
        buildingId: ticket.unit.building.id,
        title: `אישור הזמנת עבודה #${workOrder.id}`,
        description: `הזמנת עבודה עבור קריאה #${ticket.id}`,
        metadata: { ticketId: ticket.id, supplierId: dto.supplierId, costEstimate: dto.costEstimate ?? null },
      });
      return ticket;
    }
    throw new Error('No assignee specified');
  }

  async updateStatus(id: number, status: TicketStatus) {
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await this.notifications.ticketStatusChanged(ticket);
    this.websocketGateway.notifyTicketUpdate(ticket);
    await this.activity.log({
      userId: ticket.assignedTo?.id ?? undefined,
      buildingId: ticket.unit.building.id,
      entityType: 'TICKET',
      entityId: ticket.id,
      action: 'TICKET_STATUS_CHANGED',
      summary: `סטטוס הקריאה #${ticket.id} עודכן ל-${ticket.status}.`,
      metadata: { status: ticket.status, severity: ticket.severity },
    });

    return ticket;
  }

  findOne(id: number) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: ticketInclude,
    });
  }

  async addComment(ticketId: number, authorId: number, content: string) {
    return this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async updateComment(commentId: number, authorId: number, content: string) {
    const comment = await this.prisma.ticketComment.findFirst({
      where: { id: commentId, authorId },
    });

    if (!comment) {
      throw new Error('Comment not found or unauthorized');
    }

    return this.prisma.ticketComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async deleteComment(commentId: number, authorId: number) {
    const comment = await this.prisma.ticketComment.findFirst({
      where: { id: commentId, authorId },
    });

    if (!comment) {
      throw new Error('Comment not found or unauthorized');
    }

    return this.prisma.ticketComment.delete({
      where: { id: commentId },
    });
  }

  private buildWhere(filter: TicketListFilter): Prisma.TicketWhereInput {
    const where: Prisma.TicketWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.buildingId) {
      where.unit = { buildingId: filter.buildingId };
    }

    if (filter.assigneeId) {
      where.assignedToId = filter.assigneeId;
    }

    if (filter.severity) {
      where.severity = filter.severity;
    }

    if (filter.search?.trim()) {
      const numericSearch = Number.parseInt(filter.search.trim(), 10);
      where.OR = [
        ...(Number.isNaN(numericSearch) ? [] : [{ id: numericSearch }]),
        {
          comments: {
            some: {
              content: {
                contains: filter.search.trim(),
                mode: 'insensitive',
              },
            },
          },
        },
        {
          unit: {
            number: {
              contains: filter.search.trim(),
              mode: 'insensitive',
            },
          },
        },
        {
          unit: {
            building: {
              name: {
                contains: filter.search.trim(),
                mode: 'insensitive',
              },
            },
          },
        },
        {
          assignedTo: {
            email: {
              contains: filter.search.trim(),
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    return where;
  }

  private buildDispatchResponse(
    tickets: TicketWithRelations[],
    filter: TicketListFilter,
  ) {
    const now = new Date();
    const dispatchItems = tickets
      .map((ticket) => this.mapDispatchTicket(ticket, now))
      .filter((ticket) => (filter.category ? ticket.category === filter.category : true))
      .filter((ticket) => this.matchesSlaFilter(ticket.slaState, filter.slaState))
      .sort((a, b) => this.compareDispatchTickets(a, b, filter.sort));

    const queueCounts = this.buildQueueCounts(dispatchItems, now);
    const queueFiltered = dispatchItems.filter((ticket) => this.matchesQueue(ticket, filter.queue, now));
    const limitedItems = queueFiltered.slice(0, filter.limit || 100);

    const buildings = Array.from(
      new Map(dispatchItems.map((ticket) => [ticket.building.id, ticket.building])).values(),
    ).sort((a, b) => a.name.localeCompare(b.name, 'he'));

    const assignees = Array.from(
      new Map(
        dispatchItems
          .filter((ticket) => ticket.assignedTo)
          .map((ticket) => [ticket.assignedTo!.id, ticket.assignedTo!]),
      ).values(),
    ).sort((a, b) => a.email.localeCompare(b.email));

    const categories = Array.from(new Set(dispatchItems.map((ticket) => ticket.category).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'he'),
    );

    return {
      items: limitedItems,
      queueCounts,
      summary: {
        open: dispatchItems.filter((ticket) => ticket.status === 'OPEN').length,
        unassigned: dispatchItems.filter((ticket) => !ticket.assignedTo && ticket.status !== 'RESOLVED').length,
        inProgress: dispatchItems.filter((ticket) => ticket.status === 'IN_PROGRESS' || ticket.status === 'ASSIGNED').length,
        dueToday: dispatchItems.filter((ticket) => ticket.slaState === 'DUE_TODAY').length,
        breached: dispatchItems.filter((ticket) => ticket.slaState === 'BREACHED').length,
        resolvedToday: dispatchItems.filter(
          (ticket) =>
            ticket.status === 'RESOLVED' &&
            new Date(ticket.createdAt) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        ).length,
      },
      filterOptions: {
        buildings,
        assignees,
        categories,
      },
      meta: {
        total: queueFiltered.length,
      },
    };
  }

  private mapDispatchTicket(ticket: TicketWithRelations, now: Date): DispatchTicketItem {
    const structured = this.extractStructuredFields(ticket.comments[0]?.content ?? '');
    const resident = ticket.unit.residents[0];
    const latestComment = ticket.comments[ticket.comments.length - 1];
    const latestActivityAt = latestComment?.createdAt ?? ticket.createdAt;
    const primaryText = structured.body || latestComment?.content || `קריאה #${ticket.id}`;
    const title = primaryText.split('\n')[0].slice(0, 72);

    return {
      id: ticket.id,
      status: ticket.status,
      severity: ticket.severity,
      createdAt: ticket.createdAt.toISOString(),
      latestActivityAt: latestActivityAt.toISOString(),
      title,
      description: primaryText,
      category: structured.category || this.guessCategory(primaryText),
      residentContact: structured.contact || resident?.user?.phone || null,
      residentName: resident?.user?.email ?? `דייר יחידה ${ticket.unit.number}`,
      building: {
        id: ticket.unit.building.id,
        name: ticket.unit.building.name,
      },
      unit: {
        id: ticket.unitId,
        number: ticket.unit.number,
      },
      assignedTo: ticket.assignedTo
        ? {
            id: ticket.assignedTo.id,
            email: ticket.assignedTo.email,
          }
        : null,
      commentCount: ticket.comments.length,
      photoCount: ticket.photos.length,
      hasPhotos: ticket.photos.length > 0,
      photos: ticket.photos,
      slaDue: ticket.slaDue?.toISOString() ?? null,
      slaState: this.getSlaState(ticket.slaDue, ticket.status, now),
      workOrders: ticket.workOrders.map((workOrder) => ({
        id: workOrder.id,
        status: workOrder.status,
        supplierName: workOrder.supplier.name,
      })),
      comments: ticket.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author?.email ?? 'לא ידוע',
        role: comment.author?.role ?? null,
      })),
    };
  }

  private extractStructuredFields(content: string) {
    const lines = content.split('\n');
    let category = '';
    let contact = '';
    const bodyLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('קטגוריה:')) {
        category = line.replace('קטגוריה:', '').trim();
        continue;
      }
      if (line.startsWith('איש קשר:')) {
        contact = line.replace('איש קשר:', '').trim();
        continue;
      }
      bodyLines.push(line);
    }

    return {
      category,
      contact,
      body: bodyLines.join('\n').trim(),
    };
  }

  private guessCategory(text: string) {
    const normalized = text.toLowerCase();
    if (normalized.includes('מעלית')) return 'מעליות';
    if (normalized.includes('חשמל') || normalized.includes('נורה')) return 'חשמל';
    if (normalized.includes('מים') || normalized.includes('דליפ')) return 'אינסטלציה';
    if (normalized.includes('דלת') || normalized.includes('שער')) return 'גישה וביטחון';
    return 'כללי';
  }

  private getSlaState(slaDue: Date | null, status: TicketStatus, now: Date) {
    if (!slaDue || status === TicketStatus.RESOLVED) {
      return 'NONE';
    }
    if (slaDue < now) {
      return 'BREACHED';
    }

    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    if (slaDue < startOfTomorrow) {
      return 'DUE_TODAY';
    }

    const atRiskThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (slaDue < atRiskThreshold) {
      return 'AT_RISK';
    }

    return 'ON_TRACK';
  }

  private matchesSlaFilter(ticketSlaState: string, filterSlaState?: string) {
    if (!filterSlaState || filterSlaState === 'ALL') {
      return true;
    }
    return ticketSlaState === filterSlaState;
  }

  private matchesQueue(ticket: DispatchTicketItem, queue?: string, now?: Date) {
    if (!queue || queue === 'ALL') {
      return true;
    }

    const reference = now ?? new Date();

    if (queue === 'TRIAGE') {
      return ticket.status === 'OPEN';
    }
    if (queue === 'UNASSIGNED') {
      return !ticket.assignedTo && ticket.status !== 'RESOLVED';
    }
    if (queue === 'SLA_RISK') {
      return ticket.slaState === 'BREACHED' || ticket.slaState === 'DUE_TODAY' || ticket.slaState === 'AT_RISK';
    }
    if (queue === 'ACTIVE') {
      return ticket.status === 'ASSIGNED' || ticket.status === 'IN_PROGRESS';
    }
    if (queue === 'RESOLVED_RECENT') {
      return (
        ticket.status === 'RESOLVED' &&
        new Date(ticket.createdAt) >= new Date(reference.getTime() - 7 * 24 * 60 * 60 * 1000)
      );
    }

    return true;
  }

  private buildQueueCounts(tickets: DispatchTicketItem[], now: Date) {
    return {
      TRIAGE: tickets.filter((ticket) => this.matchesQueue(ticket, 'TRIAGE', now)).length,
      UNASSIGNED: tickets.filter((ticket) => this.matchesQueue(ticket, 'UNASSIGNED', now)).length,
      SLA_RISK: tickets.filter((ticket) => this.matchesQueue(ticket, 'SLA_RISK', now)).length,
      ACTIVE: tickets.filter((ticket) => this.matchesQueue(ticket, 'ACTIVE', now)).length,
      RESOLVED_RECENT: tickets.filter((ticket) => this.matchesQueue(ticket, 'RESOLVED_RECENT', now)).length,
    };
  }

  private compareDispatchTickets(
    a: DispatchTicketItem,
    b: DispatchTicketItem,
    sort?: string,
  ) {
    if (sort === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    const severityRank = {
      URGENT: 3,
      HIGH: 2,
      NORMAL: 1,
    };
    const slaRank = {
      BREACHED: 4,
      DUE_TODAY: 3,
      AT_RISK: 2,
      ON_TRACK: 1,
      NONE: 0,
    };

    return (
      severityRank[b.severity] - severityRank[a.severity] ||
      slaRank[b.slaState as keyof typeof slaRank] - slaRank[a.slaState as keyof typeof slaRank] ||
      new Date(b.latestActivityAt).getTime() - new Date(a.latestActivityAt).getTime()
    );
  }
}
