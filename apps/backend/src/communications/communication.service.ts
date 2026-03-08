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

    const residents = await this.prisma.user.findMany({
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
    });

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
            metadata: { priority, unitIds, floor, recipientRole },
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
      metadata: { priority, recipientRole, unitIds: unitIds ?? [], floor: floor ?? null },
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
      metadata: { subject: data.subject, recipientCount: recipientUsers.length },
    });

    return rows;
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
