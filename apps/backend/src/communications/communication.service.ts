import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService) {}

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

  create(dto: CreateCommunicationDto) {
    return this.prisma.communication.create({
      data: this.mapCreate(dto),
      include: { sender: true, recipient: true, building: true, unit: true, maintenanceSchedule: true },
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
