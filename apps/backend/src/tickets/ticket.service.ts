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

type DispatchWorkloadItem = {
  technicianId: number;
  technicianEmail: string;
  activeCount: number;
  riskCount: number;
  breachedCount: number;
  urgentCount: number;
  lastActivityAt: string | null;
};

type TriagePreviewInput = {
  description?: string;
  ticketId?: number;
  buildingId?: number;
  currentAssigneeId?: number;
  currentCategory?: string;
};

type TechnicianSnapshot = {
  id: number;
  email: string;
  supplier: {
    id: number;
    name: string;
    skills: string[];
    rating: number | null;
  } | null;
  assignedTickets: Array<{
    id: number;
    severity: TicketSeverity;
    status: TicketStatus;
    unit: {
      buildingId: number;
    };
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

  async updateSeverity(id: number, severity: TicketSeverity) {
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { severity },
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

    await this.activity.log({
      userId: ticket.assignedTo?.id ?? undefined,
      buildingId: ticket.unit.building.id,
      entityType: 'TICKET',
      entityId: ticket.id,
      action: 'TICKET_PRIORITY_CHANGED',
      summary: `עדיפות הקריאה #${ticket.id} עודכנה ל-${ticket.severity}.`,
      metadata: { severity: ticket.severity, status: ticket.status },
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

  async previewTriage(input: TriagePreviewInput) {
    const seededTicket = input.ticketId
      ? await this.prisma.ticket.findUnique({
          where: { id: input.ticketId },
          include: ticketInclude,
        })
      : null;

    const seededDescription = input.description?.trim() || this.extractStructuredFields(seededTicket?.comments[0]?.content ?? '').body;
    const description = seededDescription?.trim();
    if (!description) {
      throw new Error('Description is required for triage preview');
    }

    const buildingId = input.buildingId ?? seededTicket?.unit?.building?.id;
    const categoryResult = this.inferCategory(description, input.currentCategory ?? undefined);
    const severityResult = this.inferSeverity(description, categoryResult.category);
    const technicians = (await this.prisma.user.findMany({
      where: { role: 'TECH' },
      select: {
        id: true,
        email: true,
        supplier: {
          select: {
            id: true,
            name: true,
            skills: true,
            rating: true,
          },
        },
        assignedTickets: {
          where: {
            status: {
              not: TicketStatus.RESOLVED,
            },
          },
          select: {
            id: true,
            severity: true,
            status: true,
            unit: {
              select: {
                buildingId: true,
              },
            },
          },
        },
      },
      orderBy: {
        email: 'asc',
      },
    })) as TechnicianSnapshot[];

    const assignee = this.pickTechnician({
      description,
      buildingId,
      category: categoryResult.category,
      severity: severityResult.severity,
      currentAssigneeId: input.currentAssigneeId,
      technicians,
    });

    return {
      summary: this.buildTriageSummary(categoryResult.category, severityResult.severity),
      category: categoryResult.category,
      severity: severityResult.severity,
      reasons: Array.from(new Set([...categoryResult.reasons, ...severityResult.reasons, ...assignee.reasons])),
      draftResponse: this.buildDraftResponse({
        category: categoryResult.category,
        severity: severityResult.severity,
        technicianEmail: assignee.recommended?.email ?? null,
      }),
      suggestedAssignee: assignee.recommended,
      confidence: Math.min(
        0.96,
        0.42 + categoryResult.reasons.length * 0.08 + severityResult.reasons.length * 0.07 + (assignee.recommended ? 0.12 : 0),
      ),
    };
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

    const workloads = this.buildWorkloads(dispatchItems);
    const riskSummary = {
      triage: dispatchItems.filter((ticket) => ticket.status === 'OPEN').length,
      unassigned: dispatchItems.filter((ticket) => !ticket.assignedTo && ticket.status !== 'RESOLVED').length,
      atRisk: dispatchItems.filter((ticket) => ticket.slaState === 'AT_RISK').length,
      dueToday: dispatchItems.filter((ticket) => ticket.slaState === 'DUE_TODAY').length,
      breached: dispatchItems.filter((ticket) => ticket.slaState === 'BREACHED').length,
    };

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
      workload: workloads,
      riskSummary,
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

  private inferCategory(description: string, currentCategory?: string) {
    const normalized = description.toLowerCase();
    const categorySignals = [
      { category: 'אינסטלציה', keywords: ['דליפ', 'נזילה', 'מים', 'הצפה', 'ביוב', 'ברז', 'אסלה', 'צינור'] },
      { category: 'חשמל', keywords: ['חשמל', 'קצר', 'שקע', 'מפסק', 'תאורה', 'נורה', 'לוח חשמל'] },
      { category: 'מעליות', keywords: ['מעלית', 'מעליות', 'נתקע', 'חילוץ', 'קומה'] },
      { category: 'גישה וביטחון', keywords: ['שער', 'דלת', 'אינטרקום', 'קודן', 'מנעול', 'אבטחה', 'מצלמה'] },
      { category: 'ניקיון', keywords: ['ניקיון', 'אשפה', 'לכלוך', 'ריח', 'פח'] },
      { category: 'מיזוג ואוורור', keywords: ['מזגן', 'מיזוג', 'אוורור', 'vent', 'hvac'] },
    ];

    let best = { category: currentCategory || this.guessCategory(description), score: currentCategory ? 1 : 0, reasons: [] as string[] };
    for (const signal of categorySignals) {
      const matches = signal.keywords.filter((keyword) => normalized.includes(keyword));
      if (matches.length > best.score) {
        best = {
          category: signal.category,
          score: matches.length,
          reasons: [`זוהו מונחים שמרמזים על ${signal.category}: ${matches.slice(0, 3).join(', ')}`],
        };
      }
    }

    if (!best.reasons.length) {
      best.reasons.push(`לא נמצאו מילות מפתח חד-משמעיות, לכן נשמרה קטגוריית ${best.category}.`);
    }

    return best;
  }

  private inferSeverity(description: string, category: string) {
    const normalized = description.toLowerCase();
    const urgentSignals = ['הצפה', 'עשן', 'שריפה', 'גז', 'התחשמלות', 'תקוע', 'אין חשמל', 'סכנה', 'חירום'];
    const highSignals = ['דליפ', 'נזילה', 'אין מים', 'לא עובד', 'תקלה', 'חשוך', 'ריח', 'דחוף'];
    const urgentMatches = urgentSignals.filter((keyword) => normalized.includes(keyword));
    const highMatches = highSignals.filter((keyword) => normalized.includes(keyword));

    if (urgentMatches.length || normalized.includes('!!!')) {
      return {
        severity: TicketSeverity.URGENT,
        reasons: [`רמת הדחיפות הועלתה לבהולה בגלל: ${urgentMatches.slice(0, 3).join(', ') || 'סימני חירום בתיאור'}`],
      };
    }

    if (highMatches.length || category === 'מעליות') {
      return {
        severity: TicketSeverity.HIGH,
        reasons: [
          highMatches.length
            ? `התקלה מסומנת כדחופה בגלל: ${highMatches.slice(0, 3).join(', ')}`
            : `תקלות בקטגוריית ${category} מקבלות עדיפות מוגברת כברירת מחדל.`,
        ],
      };
    }

    return {
      severity: TicketSeverity.NORMAL,
      reasons: ['לא זוהו סימני חירום או פגיעה מיידית ולכן נשמרה עדיפות רגילה.'],
    };
  }

  private pickTechnician(input: {
    description: string;
    buildingId?: number;
    category: string;
    severity: TicketSeverity;
    currentAssigneeId?: number;
    technicians: TechnicianSnapshot[];
  }) {
    const normalized = input.description.toLowerCase();
    const scored = input.technicians.map((technician) => {
      const skills = technician.supplier?.skills ?? [];
      const skillMatches = skills.filter((skill) => normalized.includes(skill.toLowerCase()) || skill.toLowerCase().includes(input.category.toLowerCase())).length;
      const activeCount = technician.assignedTickets.length;
      const urgentCount = technician.assignedTickets.filter((ticket) => ticket.severity === TicketSeverity.URGENT).length;
      const sameBuildingCount = input.buildingId
        ? technician.assignedTickets.filter((ticket) => ticket.unit.buildingId === input.buildingId).length
        : 0;
      const score =
        skillMatches * 4 +
        sameBuildingCount * 1.6 +
        (technician.supplier?.rating ?? 3) * 0.4 -
        activeCount * 0.8 -
        urgentCount * 1.2 -
        (input.currentAssigneeId && technician.id === input.currentAssigneeId ? 0.5 : 0);

      return {
        technician,
        score,
        activeCount,
        urgentCount,
        skillMatches,
        sameBuildingCount,
      };
    });

    const recommended = [...scored].sort((left, right) => right.score - left.score)[0];
    if (!recommended) {
      return {
        recommended: null,
        reasons: ['לא נמצאו טכנאים זמינים להצעה אוטומטית.'],
      };
    }

    const reasons = [
      recommended.skillMatches
        ? `הטכנאי ${recommended.technician.email} תואם למיומנויות הנדרשות.`
        : `נבחר הטכנאי הפנוי ביותר ביחס לעומס הנוכחי.`,
      recommended.sameBuildingCount ? 'יש לו היכרות פעילה עם הבניין הזה.' : 'אין כרגע היסטוריית עומס חריגה על אותו בניין.',
      `עומס פתוח נוכחי: ${recommended.activeCount} קריאות, מהן ${recommended.urgentCount} בהולות.`,
    ];

    return {
      recommended: {
        id: recommended.technician.id,
        email: recommended.technician.email,
        score: Number(recommended.score.toFixed(2)),
        reason: reasons[0],
      },
      reasons,
    };
  }

  private buildDraftResponse(input: { category: string; severity: TicketSeverity; technicianEmail: string | null }) {
    const responseLead =
      input.severity === TicketSeverity.URGENT
        ? 'קיבלנו את הפנייה והיא סומנה כבהולה. הצוות מתחיל טיפול מיידי.'
        : input.severity === TicketSeverity.HIGH
          ? 'קיבלנו את הפנייה והיא הועברה לטיפול בעדיפות גבוהה.'
          : 'קיבלנו את הפנייה והיא נפתחה לטיפול מסודר מול צוות התחזוקה.';

    const assigneeLine = input.technicianEmail ? `רכזנו את הטיפול הראשוני מול ${input.technicianEmail}.` : 'נעדכן שיוך מטפל מיד לאחר המיון הראשוני.';

    return `${responseLead}\nהמערכת זיהתה את הקריאה כ-${input.category}.\n${assigneeLine}\nאם יש החמרה או שינוי בגישה לבניין, אפשר להשיב להודעה הזו ונעדכן את התיאום.`;
  }

  private buildTriageSummary(category: string, severity: TicketSeverity) {
    const severityLabel =
      severity === TicketSeverity.URGENT ? 'בהולה' : severity === TicketSeverity.HIGH ? 'דחופה' : 'רגילה';
    return `המערכת ממליצה למיין את הקריאה כ-${category} ולהצמיד לה עדיפות ${severityLabel}.`;
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

  private buildWorkloads(tickets: DispatchTicketItem[]): DispatchWorkloadItem[] {
    const workloadMap = new Map<number, DispatchWorkloadItem>();

    for (const ticket of tickets) {
      if (!ticket.assignedTo || ticket.status === 'RESOLVED') {
        continue;
      }

      const current = workloadMap.get(ticket.assignedTo.id) ?? {
        technicianId: ticket.assignedTo.id,
        technicianEmail: ticket.assignedTo.email,
        activeCount: 0,
        riskCount: 0,
        breachedCount: 0,
        urgentCount: 0,
        lastActivityAt: null,
      };

      current.activeCount += 1;
      if (ticket.slaState === 'AT_RISK' || ticket.slaState === 'DUE_TODAY' || ticket.slaState === 'BREACHED') {
        current.riskCount += 1;
      }
      if (ticket.slaState === 'BREACHED') {
        current.breachedCount += 1;
      }
      if (ticket.severity === 'URGENT') {
        current.urgentCount += 1;
      }
      current.lastActivityAt =
        !current.lastActivityAt || new Date(ticket.latestActivityAt) > new Date(current.lastActivityAt)
          ? ticket.latestActivityAt
          : current.lastActivityAt;

      workloadMap.set(ticket.assignedTo.id, current);
    }

    return Array.from(workloadMap.values()).sort((a, b) => {
      return (
        a.breachedCount - b.breachedCount ||
        a.riskCount - b.riskCount ||
        a.activeCount - b.activeCount ||
        a.technicianEmail.localeCompare(b.technicianEmail)
      );
    });
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
