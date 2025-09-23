import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AssetService {
  constructor(private prisma: PrismaService) {}

  private mapCreate(dto: CreateAssetDto): Prisma.AssetCreateInput {
    const { buildingId, purchaseDate, warrantyExpiry, ...rest } = dto;
    return {
      ...rest,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      building: { connect: { id: buildingId } },
    };
  }

  private mapUpdate(dto: UpdateAssetDto): Prisma.AssetUpdateInput {
    const { buildingId, purchaseDate, warrantyExpiry, ...rest } = dto;
    return {
      ...rest,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      building: buildingId ? { connect: { id: buildingId } } : undefined,
    };
  }

  create(dto: CreateAssetDto) {
    return this.prisma.asset.create({
      data: this.mapCreate(dto),
      include: { building: true, maintenanceSchedules: true, documents: true },
    });
  }

  findAll() {
    return this.prisma.asset.findMany({
      include: { building: true, maintenanceSchedules: true, documents: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.asset.findUnique({
      where: { id },
      include: { building: true, maintenanceSchedules: true, documents: true },
    });
  }

  findForBuilding(buildingId: number) {
    return this.prisma.asset.findMany({
      where: { buildingId },
      include: { maintenanceSchedules: true, documents: true },
      orderBy: { name: 'asc' },
    });
  }

  update(id: number, dto: UpdateAssetDto) {
    return this.prisma.asset.update({
      where: { id },
      data: this.mapUpdate(dto),
      include: { building: true, maintenanceSchedules: true, documents: true },
    });
  }

  remove(id: number) {
    return this.prisma.asset.delete({ where: { id } });
  }

  async getAssetHealth(id: number) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        maintenanceSchedules: {
          include: { assignedTo: true },
          orderBy: { nextOccurrence: 'asc' },
        },
        documents: true,
        building: true,
      },
    });

    if (!asset) {
      return null;
    }

    const completedSchedules = await this.prisma.communication.count({
      where: {
        maintenanceSchedule: { assetId: id },
        channel: 'INTERNAL',
      },
    });

    const upcoming = asset.maintenanceSchedules.filter(
      (schedule) => !schedule.nextOccurrence || schedule.nextOccurrence >= new Date(),
    );

    return {
      asset,
      metrics: {
        maintenanceCount: asset.maintenanceSchedules.length,
        completedReports: completedSchedules,
        upcomingCount: upcoming.length,
      },
      upcoming,
    };
  }
}
