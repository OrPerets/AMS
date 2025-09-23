import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';
import { Prisma } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class CommunicationService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
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
    subject: string;
    message: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }) {
    const { senderId, buildingId, subject, message, priority = 'MEDIUM' } = data;

    // Get all residents in the building
    const residents = await this.prisma.user.findMany({
      where: {
        resident: {
          units: {
            some: buildingId ? { buildingId } : undefined,
          },
        },
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
            metadata: { priority },
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

    return communications;
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
