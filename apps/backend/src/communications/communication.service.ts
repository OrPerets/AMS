import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';
import { Prisma } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class CommunicationService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private activity: ActivityService,
  ) {}

  private mapCreate(dto: CreateCommunicationDto): Prisma.CommunicationCreateInput {
    const { buildingId, unitId, senderId, recipientId, maintenanceScheduleId, ...rest } = dto;
    return {
      ...rest,
      building: buildingId ? { connect: { id: buildingId } } : undefined,
      unit: unitId ? { connect: { id: unitId } } : undefined,
      sender: { connect: { id: senderId } },
      recipient: recipientId ? { connect: { id: recipientId } } : undefined,
      maintenanceSchedule: maintenanceScheduleId
        ? { connect: { id: maintenanceScheduleId } }
        : undefined,
    };
  }

  private async resolveAnnouncementRecipients(data: {
    buildingId?: number;
    unitIds?: number[];
    floor?: number;
    residentIds?: number[];
    recipientRole?: 'RESIDENT' | 'PM' | 'ADMIN';
  }) {
    const {
      buildingId,
      unitIds,
      floor,
      residentIds,
      recipientRole = 'RESIDENT',
    } = data;

    return this.prisma.user.findMany({
      where: {
        role: recipientRole,
        ...(recipientRole === 'RESIDENT'
          ? {
              resident: {
                units: {
                  some: {
                    ...(buildingId ? { buildingId } : {}),
                    ...(unitIds?.length ? { id: { in: unitIds } } : {}),
                    ...(floor !== undefined ? { floor } : {}),
                  },
                },
              },
            }
          : {}),
        ...(residentIds?.length ? { id: { in: residentIds } } : {}),
      },
      include: {
        resident: {
          include: {
            units: true,
          },
        },
      },
    });
  }

  private mapUpdate(dto: UpdateCommunicationDto): Prisma.CommunicationUpdateInput {
    const { buildingId, unitId, senderId, recipientId, maintenanceScheduleId, ...rest } = dto;
    return {
      ...rest,
      building: buildingId ? { connect: { id: buildingId } } : undefined,
      unit: unitId ? { connect: { id: unitId } } : undefined,
      sender: senderId ? { connect: { id: senderId } } : undefined,
      recipient: recipientId ? { connect: { id: recipientId } } : undefined,
      maintenanceSchedule: maintenanceScheduleId
        ? { connect: { id: maintenanceScheduleId } }
        : undefined,
    };
  }

  async create(dto: CreateCommunicationDto) {
    const communication = await this.prisma.communication.create({
      data: this.mapCreate(dto),
      include: { sender: true, recipient: true, building: true, unit: true, maintenanceSchedule: true },
    });

    // Send notification to recipient if specified
    if (communication.recipientId) {
      await this.notificationService.notifyUser(
        communication.recipientId,
        'ANNOUNCEMENT' as any,
        {
          title: communication.subject || 'הודעה חדשה',
          message: communication.message,
        }
      );
    }

    return communication;
  }

  // Create announcement for all building residents
  async createAnnouncement(data: {
    senderId: number;
    buildingId?: number;
    unitIds?: number[];
    floor?: number;
    residentIds?: number[];
    recipientRole?: 'RESIDENT' | 'PM' | 'ADMIN';
    subject: string;
    message: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }) {
    const {
      senderId,
      buildingId,
      unitIds,
      floor,
      residentIds,
      recipientRole = 'RESIDENT',
      subject,
      message,
      priority = 'MEDIUM',
    } = data;

    const residents = await this.resolveAnnouncementRecipients({ buildingId, unitIds, floor, residentIds, recipientRole });
    const batchKey = `announcement-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

    // Create communications for each resident
    const communications = await Promise.all(
      residents.map(resident =>
        this.prisma.communication.create({
          data: {
            senderId,
            recipientId: resident.id,
            buildingId,
            subject,
            message,
            channel: 'ANNOUNCEMENT',
            metadata: { priority, unitIds, floor, recipientRole, batchKey },
          },
          include: { sender: true, recipient: true, building: true },
        })
      )
    );

    // Send notifications to all residents
    await Promise.all(
      residents.map(resident =>
        this.notificationService.notifyUser(
          resident.id,
          'ANNOUNCEMENT' as any,
          { title: subject, message }
        )
      )
    );

    await this.activity.log({
      userId: senderId,
      buildingId,
      entityType: 'ANNOUNCEMENT',
      action: 'ANNOUNCEMENT_CREATED',
      summary: `נשלחה הודעה ממוקדת ל-${communications.length} נמענים.`,
      metadata: { priority, recipientRole, unitIds: unitIds ?? [], floor: floor ?? null, batchKey },
    });

    return communications;
  }

  async createResidentRequest(
    requesterUserId: number,
    data: {
      buildingId?: number;
      unitId?: number;
      requestType: 'MOVING' | 'PARKING' | 'DOCUMENT' | 'CONTACT_UPDATE' | 'GENERAL';
      subject: string;
      message: string;
      requestedDate?: string;
      metadata?: Record<string, any>;
    },
  ) {
    const requester = await this.prisma.user.findUniqueOrThrow({
      where: { id: requesterUserId },
      include: {
        resident: {
          include: {
            units: true,
          },
        },
      },
    });

    const recipientUsers = await this.prisma.user.findMany({
      where: {
        tenantId: requester.tenantId,
        role: {
          in: ['ADMIN', 'PM', 'MASTER'],
        },
      },
      select: {
        id: true,
      },
    });

    const buildingId = data.buildingId ?? requester.resident?.units[0]?.buildingId;
    const residentId = requester.resident?.id;
    const requestKey = `request-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

    const rows = await Promise.all(
      recipientUsers.map((recipient) =>
        this.prisma.communication.create({
          data: {
            senderId: requesterUserId,
            recipientId: recipient.id,
            buildingId,
            unitId: data.unitId,
            subject: `${data.requestType}: ${data.subject}`,
            message: data.message,
            channel: 'REQUEST',
            metadata: {
              requestKey,
              status: 'SUBMITTED',
              requestType: data.requestType,
              requestedDate: data.requestedDate ?? null,
              ...data.metadata,
            },
          },
        }),
      ),
    );

    await Promise.all(
      recipientUsers.map((recipient) =>
        this.prisma.notification.create({
          data: {
            title: `${data.requestType}: ${data.subject}`,
            message: data.message,
            type: 'RESIDENT_REQUEST',
            tenantId: requester.tenantId,
            userId: recipient.id,
            buildingId,
            metadata: {
              requestKey,
              requestType: data.requestType,
              requestedDate: data.requestedDate ?? null,
            } as any,
          },
        }),
      ),
    );

    await this.activity.log({
      userId: requesterUserId,
      buildingId,
      residentId,
      entityType: 'RESIDENT_REQUEST',
      action: 'REQUEST_CREATED',
      summary: `נוצרה בקשת דייר מסוג ${data.requestType}.`,
      metadata: { subject: data.subject, recipientCount: recipientUsers.length, requestKey },
    });

    return rows;
  }

  async listResidentRequests(input: {
    userId: number;
    role: string;
    status?: string;
    requestType?: string;
  }) {
    const rows = await this.prisma.communication.findMany({
      where: {
        channel: 'REQUEST',
        ...(input.role === 'RESIDENT'
          ? { senderId: input.userId }
          : { recipientId: input.userId }),
      },
      include: {
        sender: true,
        recipient: true,
        building: true,
        unit: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = new Map<string, any>();
    for (const row of rows) {
      const metadata = (row.metadata ?? {}) as Record<string, any>;
      const requestKey = String(metadata.requestKey ?? `legacy-${row.id}`);
      const current = grouped.get(requestKey) ?? {
        requestKey,
        subject: row.subject,
        message: row.message,
        createdAt: row.createdAt,
        updatedAt: row.createdAt,
        requestType: metadata.requestType ?? 'GENERAL',
        requestedDate: metadata.requestedDate ?? null,
        status: metadata.status ?? 'SUBMITTED',
        statusNotes: metadata.statusNotes ?? null,
        buildingName: row.building?.name ?? null,
        unitNumber: row.unit?.number ?? null,
        senderEmail: row.sender?.email ?? null,
        recipientCount: 0,
      };
      current.updatedAt = row.createdAt > current.updatedAt ? row.createdAt : current.updatedAt;
      current.status = metadata.status ?? current.status;
      current.statusNotes = metadata.statusNotes ?? current.statusNotes;
      current.recipientCount += row.recipientId ? 1 : 0;
      grouped.set(requestKey, current);
    }

    return Array.from(grouped.values())
      .filter((item) => (input.status ? item.status === input.status : true))
      .filter((item) => (input.requestType ? item.requestType === input.requestType : true))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updateResidentRequestStatus(
    requestKey: string,
    actorUserId: number,
    input: { status: 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CLOSED'; statusNotes?: string | null },
  ) {
    const rows = await this.prisma.communication.findMany({
      where: {
        channel: 'REQUEST',
      },
    });

    const matchingIds = rows
      .filter((row) => {
        const metadata = (row.metadata ?? {}) as Record<string, any>;
        return String(metadata.requestKey ?? '') === requestKey;
      })
      .map((row) => row.id);

    if (!matchingIds.length) {
      return [];
    }

    const updated = await Promise.all(
      matchingIds.map(async (id) => {
        const existing = await this.prisma.communication.findUniqueOrThrow({ where: { id } });
        const metadata = (existing.metadata ?? {}) as Record<string, any>;
        return this.prisma.communication.update({
          where: { id },
          data: {
            metadata: {
              ...metadata,
              status: input.status,
              statusNotes: input.statusNotes ?? null,
              statusUpdatedAt: new Date().toISOString(),
            } as any,
          },
        });
      }),
    );

    const first = await this.prisma.communication.findUnique({ where: { id: matchingIds[0] }, include: { building: true } });
    await this.activity.log({
      userId: actorUserId,
      buildingId: first?.buildingId ?? undefined,
      entityType: 'RESIDENT_REQUEST',
      action: 'REQUEST_STATUS_UPDATED',
      summary: `סטטוס בקשת דייר עודכן ל-${input.status}.`,
      metadata: { requestKey, statusNotes: input.statusNotes ?? null },
    });

    return updated;
  }

  async previewAnnouncement(input: {
    buildingId?: number;
    unitIds?: number[];
    floor?: number;
    residentIds?: number[];
    recipientRole?: 'RESIDENT' | 'PM' | 'ADMIN';
  }) {
    const recipients = await this.resolveAnnouncementRecipients(input);
    return {
      count: recipients.length,
      recipients: recipients.slice(0, 25).map((recipient) => ({
        id: recipient.id,
        email: recipient.email,
        role: recipient.role,
        units: recipient.resident?.units.map((unit) => ({ id: unit.id, number: unit.number, floor: unit.floor })) ?? [],
      })),
    };
  }

  async listAnnouncementHistory(input: { buildingId?: number }) {
    const rows = await this.prisma.communication.findMany({
      where: {
        channel: 'ANNOUNCEMENT',
        ...(input.buildingId ? { buildingId: input.buildingId } : {}),
      },
      include: {
        sender: true,
        recipient: true,
        building: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = new Map<string, any>();
    for (const row of rows) {
      const metadata = (row.metadata ?? {}) as Record<string, any>;
      const batchKey = String(metadata.batchKey ?? `legacy-${row.id}`);
      const current = grouped.get(batchKey) ?? {
        batchKey,
        subject: row.subject,
        message: row.message,
        createdAt: row.createdAt,
        buildingName: row.building?.name ?? null,
        priority: metadata.priority ?? 'MEDIUM',
        recipientRole: metadata.recipientRole ?? 'RESIDENT',
        recipientCount: 0,
        sampleRecipients: [] as string[],
      };
      current.recipientCount += row.recipientId ? 1 : 0;
      if (row.recipient?.email && current.sampleRecipients.length < 4) {
        current.sampleRecipients.push(row.recipient.email);
      }
      grouped.set(batchKey, current);
    }

    return Array.from(grouped.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async listPublishedDocuments(buildingId?: number) {
    return this.prisma.document.findMany({
      where: {
        accessLevel: 'PUBLIC',
        ...(buildingId ? { buildingId } : {}),
        category: {
          in: ['meeting_summary', 'signed_protocol', 'regulation', 'committee_decision'],
        },
      },
      include: {
        building: true,
        uploadedBy: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async publishDocumentNotice(data: {
    senderId: number;
    documentId: number;
    buildingId: number;
    bulletinType: 'meeting_summary' | 'signed_protocol' | 'regulation' | 'committee_decision';
    subject: string;
    message: string;
  }) {
    const document = await this.prisma.document.update({
      where: { id: data.documentId },
      data: {
        buildingId: data.buildingId,
        category: data.bulletinType,
        accessLevel: 'PUBLIC',
      },
    });

    const communications = await this.createAnnouncement({
      senderId: data.senderId,
      buildingId: data.buildingId,
      recipientRole: 'RESIDENT',
      subject: data.subject,
      message: data.message,
      priority: 'HIGH',
    });

    await this.activity.log({
      userId: data.senderId,
      buildingId: data.buildingId,
      entityType: 'DOCUMENT_BULLETIN',
      entityId: document.id,
      action: 'DOCUMENT_BULLETIN_PUBLISHED',
      summary: `פורסם מסמך דיירים מסוג ${data.bulletinType}.`,
      metadata: { documentId: document.id, recipientCount: communications.length },
    });

    return { document, recipientCount: communications.length };
  }

  // Get conversation thread between two users
  async getConversation(user1Id: number, user2Id: number, buildingId?: number) {
    return this.prisma.communication.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: user1Id, recipientId: user2Id },
              { senderId: user2Id, recipientId: user1Id },
            ],
          },
          buildingId ? { buildingId } : {},
        ],
      },
      include: { sender: true, recipient: true, building: true, unit: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Search communications
  async searchCommunications(query: string, userId?: number, buildingId?: number) {
    const where: Prisma.CommunicationWhereInput = {
      OR: [
        { subject: { contains: query, mode: 'insensitive' } },
        { message: { contains: query, mode: 'insensitive' } },
      ],
      ...(userId && {
        OR: [
          { senderId: userId },
          { recipientId: userId },
        ],
      }),
      ...(buildingId && { buildingId }),
    };

    return this.prisma.communication.findMany({
      where,
      include: { sender: true, recipient: true, building: true, unit: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.communication.findMany({
      include: { sender: true, recipient: true, building: true, unit: true, maintenanceSchedule: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.communication.findUnique({
      where: { id },
      include: { sender: true, recipient: true, building: true, unit: true, maintenanceSchedule: true },
    });
  }

  findForBuilding(buildingId: number) {
    return this.prisma.communication.findMany({
      where: { buildingId },
      include: { sender: true, recipient: true, unit: true, maintenanceSchedule: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  getInbox(userId: number) {
    return this.prisma.communication.findMany({
      where: { recipientId: userId },
      include: { sender: true, building: true, unit: true, maintenanceSchedule: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  getOutbox(userId: number) {
    return this.prisma.communication.findMany({
      where: { senderId: userId },
      include: { recipient: true, building: true, unit: true, maintenanceSchedule: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(id: number) {
    return this.prisma.communication.update({
      where: { id },
      data: { readAt: new Date() },
      include: { sender: true, recipient: true },
    });
  }

  update(id: number, dto: UpdateCommunicationDto) {
    return this.prisma.communication.update({
      where: { id },
      data: this.mapUpdate(dto),
      include: { sender: true, recipient: true, building: true, unit: true, maintenanceSchedule: true },
    });
  }

  remove(id: number) {
    return this.prisma.communication.delete({ where: { id } });
  }
}
