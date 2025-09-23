import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  private mapCreateDto(dto: CreateMaintenanceDto): Prisma.MaintenanceScheduleCreateInput {
    const { buildingId, assetId, assignedToId, startDate, nextOccurrence, ...rest } = dto;
    return {
      ...rest,
      startDate: new Date(startDate),
      nextOccurrence: nextOccurrence ? new Date(nextOccurrence) : undefined,
      building: { connect: { id: buildingId } },
      asset: assetId ? { connect: { id: assetId } } : undefined,
      assignedTo: assignedToId ? { connect: { id: assignedToId } } : undefined,
    };
  }

  private mapUpdateDto(dto: UpdateMaintenanceDto): Prisma.MaintenanceScheduleUpdateInput {
    const { buildingId, assetId, assignedToId, startDate, nextOccurrence, ...rest } = dto;
    return {
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      nextOccurrence: nextOccurrence ? new Date(nextOccurrence) : undefined,
      building: buildingId ? { connect: { id: buildingId } } : undefined,
      asset: assetId ? { connect: { id: assetId } } : assetId === null ? { disconnect: true } : undefined,
      assignedTo: assignedToId
        ? { connect: { id: assignedToId } }
        : assignedToId === null
        ? { disconnect: true }
        : undefined,
    };
  }

  create(dto: CreateMaintenanceDto) {
    return this.prisma.maintenanceSchedule.create({
      data: this.mapCreateDto(dto),
      include: { asset: true, assignedTo: true, building: true },
    });
  }

  findAll() {
    return this.prisma.maintenanceSchedule.findMany({
      include: {
        building: true,
        asset: true,
        assignedTo: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.maintenanceSchedule.findUnique({
      where: { id },
      include: { building: true, asset: true, assignedTo: true, communications: true },
    });
  }

  findByBuilding(buildingId: number) {
    return this.prisma.maintenanceSchedule.findMany({
      where: { buildingId },
      include: { asset: true, assignedTo: true },
      orderBy: { nextOccurrence: 'asc' },
    });
  }

  update(id: number, dto: UpdateMaintenanceDto) {
    return this.prisma.maintenanceSchedule.update({
      where: { id },
      data: this.mapUpdateDto(dto),
      include: { asset: true, assignedTo: true, building: true },
    });
  }

  remove(id: number) {
    return this.prisma.maintenanceSchedule.delete({ where: { id } });
  }

  getCalendar(buildingId: number, start: Date, end: Date) {
    return this.prisma.maintenanceSchedule.findMany({
      where: {
        buildingId,
        OR: [
          { startDate: { gte: start, lte: end } },
          { nextOccurrence: { gte: start, lte: end } },
        ],
      },
      include: { asset: true, assignedTo: true },
      orderBy: { startDate: 'asc' },
    });
  }
}
