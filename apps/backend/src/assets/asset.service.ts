import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { UpdateAssetLocationDto } from './dto/update-asset-location.dto';
import { AssetDepreciationOptionsDto } from './dto/asset-depreciation-options.dto';

@Injectable()
export class AssetService {
  private readonly include = {
    building: true,
    unit: true,
    maintenanceSchedules: {
      include: { assignedTo: true },
      orderBy: { nextOccurrence: 'asc' },
    },
    maintenanceHistories: {
      include: { performedBy: true, verifiedBy: true, schedule: true },
      orderBy: { performedAt: 'desc' },
    },
    documents: true,
    locationHistory: { orderBy: { changedAt: 'desc' } },
  } as const;

  constructor(private prisma: PrismaService) {}

  private mapCreate(dto: CreateAssetDto): Prisma.AssetCreateInput {
    const {
      buildingId,
      unitId,
      purchaseDate,
      warrantyExpiry,
      lastInventoryCheck,
      nextInventoryCheck,
      quantity,
      ...rest
    } = dto;

    return {
      ...rest,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      lastInventoryCheck: lastInventoryCheck ? new Date(lastInventoryCheck) : undefined,
      nextInventoryCheck: nextInventoryCheck ? new Date(nextInventoryCheck) : undefined,
      quantity: quantity ?? undefined,
      building: { connect: { id: buildingId } },
      unit: unitId ? { connect: { id: unitId } } : undefined,
    };
  }

  private mapUpdate(dto: UpdateAssetDto): Prisma.AssetUpdateInput {
    const {
      buildingId,
      unitId,
      purchaseDate,
      warrantyExpiry,
      lastInventoryCheck,
      nextInventoryCheck,
      quantity,
      ...rest
    } = dto;

    return {
      ...rest,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      lastInventoryCheck: lastInventoryCheck ? new Date(lastInventoryCheck) : undefined,
      nextInventoryCheck: nextInventoryCheck ? new Date(nextInventoryCheck) : undefined,
      quantity: quantity ?? undefined,
      building: buildingId ? { connect: { id: buildingId } } : undefined,
      unit:
        unitId === undefined
          ? undefined
          : unitId
            ? { connect: { id: unitId } }
            : { disconnect: true },
    };
  }

  private async findOneWithClient(id: number, client: Prisma.TransactionClient) {
    return client.asset.findUniqueOrThrow({ where: { id }, include: this.include });
  }

  create(dto: CreateAssetDto) {
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: this.mapCreate(dto),
        include: this.include,
      });

      if (dto.location) {
        await tx.assetLocationHistory.create({
          data: {
            assetId: asset.id,
            location: dto.location,
            notes: 'Initial location',
          },
        });
      }

      return this.findOneWithClient(asset.id, tx);
    });
  }

  findAll() {
    return this.prisma.asset.findMany({
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.asset.findUnique({
      where: { id },
      include: this.include,
    });
  }

  findForBuilding(buildingId: number) {
    return this.prisma.asset.findMany({
      where: { buildingId },
      include: this.include,
      orderBy: { name: 'asc' },
    });
  }

  update(id: number, dto: UpdateAssetDto) {
    return this.prisma.asset.update({
      where: { id },
      data: this.mapUpdate(dto),
      include: this.include,
    });
  }

  remove(id: number) {
    return this.prisma.asset.delete({ where: { id } });
  }

  async updateLocation(id: number, dto: UpdateAssetLocationDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.assetLocationHistory.create({
        data: {
          assetId: id,
          location: dto.location,
          notes: dto.notes,
        },
      });

      await tx.asset.update({
        where: { id },
        data: { location: dto.location },
      });

      return this.findOneWithClient(id, tx);
    });
  }

  async getInventorySummary(buildingId?: number) {
    const where: Prisma.AssetWhereInput = buildingId ? { buildingId } : {};
    const assets = await this.prisma.asset.findMany({
      where,
      select: {
        id: true,
        buildingId: true,
        unitId: true,
        quantity: true,
        status: true,
        category: true,
        value: true,
      },
    });

    const totalQuantity = assets.reduce((sum, asset) => sum + (asset.quantity ?? 0), 0);
    const totalValue = assets.reduce((sum, asset) => {
      const quantity = asset.quantity ?? 0;
      const value = asset.value ?? 0;
      return sum + quantity * value;
    }, 0);

    const byStatus = assets.reduce((acc, asset) => {
      const key = asset.status ?? 'UNSPECIFIED';
      if (!acc[key]) {
        acc[key] = { count: 0, quantity: 0 };
      }
      acc[key].count += 1;
      acc[key].quantity += asset.quantity ?? 0;
      return acc;
    }, {} as Record<string, { count: number; quantity: number }>);

    const byCategory = assets.reduce((acc, asset) => {
      const key = asset.category;
      if (!acc[key]) {
        acc[key] = { count: 0, quantity: 0 };
      }
      acc[key].count += 1;
      acc[key].quantity += asset.quantity ?? 0;
      return acc;
    }, {} as Record<string, { count: number; quantity: number }>);

    return {
      buildingId: buildingId ?? null,
      totalAssets: assets.length,
      totalQuantity,
      totalValue,
      assignedToUnits: assets.filter((asset) => asset.unitId !== null).length,
      byStatus,
      byCategory,
    };
  }

  getMaintenanceHistory(assetId: number) {
    return this.prisma.maintenanceHistory.findMany({
      where: { assetId },
      include: { schedule: true, performedBy: true, verifiedBy: true },
      orderBy: { performedAt: 'desc' },
    });
  }

  async exportMaintenanceHistoryCsv(assetId?: number, buildingId?: number) {
    const histories = await this.prisma.maintenanceHistory.findMany({
      where: {
        ...(assetId ? { assetId } : {}),
        ...(buildingId ? { asset: { buildingId } } : {}),
      },
      include: {
        asset: true,
        schedule: { include: { building: true } },
        performedBy: true,
        verifiedBy: true,
      },
      orderBy: { performedAt: 'desc' },
    });

    return [
      ['historyId', 'assetId', 'assetName', 'buildingName', 'performedAt', 'cost', 'verified', 'performedBy', 'verifiedBy', 'notes'].join(','),
      ...histories.map((history) =>
        [
          history.id,
          history.assetId ?? '',
          JSON.stringify(history.asset?.name ?? ''),
          JSON.stringify(history.schedule.building.name),
          history.performedAt.toISOString(),
          history.cost ?? 0,
          history.verified,
          JSON.stringify(history.performedBy?.email ?? ''),
          JSON.stringify(history.verifiedBy?.email ?? ''),
          JSON.stringify(history.notes ?? ''),
        ].join(','),
      ),
    ].join('\n');
  }

  async calculateDepreciation(id: number, options: AssetDepreciationOptionsDto = {}) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      select: {
        id: true,
        value: true,
        salvageValue: true,
        usefulLifeYears: true,
        depreciationMethod: true,
        purchaseDate: true,
        quantity: true,
      },
    });

    if (!asset || !asset.purchaseDate || asset.value === null || asset.value === undefined) {
      return {
        assetId: id,
        depreciation: null,
        message: 'Asset value or purchase date missing for depreciation calculation',
      };
    }

    const usefulLifeYears = options.usefulLifeYears ?? asset.usefulLifeYears ?? 10;
    const salvageValue = options.salvageValue ?? asset.salvageValue ?? 0;
    const today = new Date();
    const ageMs = today.getTime() - asset.purchaseDate.getTime();
    const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    const depreciableBase = Math.max(0, asset.value - salvageValue);
    const annualDepreciation = depreciableBase / usefulLifeYears;
    const accumulatedDepreciation = Math.min(depreciableBase, Math.max(0, annualDepreciation * ageYears));
    const bookValue = Math.max(0, asset.value - accumulatedDepreciation);

    return {
      assetId: id,
      method: asset.depreciationMethod ?? 'STRAIGHT_LINE',
      usefulLifeYears,
      salvageValue,
      annualDepreciation: Number(annualDepreciation.toFixed(2)),
      accumulatedDepreciation: Number(accumulatedDepreciation.toFixed(2)),
      bookValue: Number(bookValue.toFixed(2)),
      ageYears: Number(ageYears.toFixed(2)),
      quantity: asset.quantity ?? 1,
    };
  }

  async getWarrantyStatus(id: number) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      select: { warrantyExpiry: true },
    });

    if (!asset || !asset.warrantyExpiry) {
      return {
        assetId: id,
        hasWarranty: false,
      };
    }

    const today = new Date();
    const expiry = asset.warrantyExpiry;
    const msRemaining = expiry.getTime() - today.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    return {
      assetId: id,
      hasWarranty: true,
      status: msRemaining >= 0 ? 'ACTIVE' : 'EXPIRED',
      warrantyExpiry: expiry,
      daysRemaining,
    };
  }

  async getAssetHealth(id: number) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: this.include,
    });

    if (!asset) {
      return null;
    }

    const upcoming = asset.maintenanceSchedules.filter((schedule) => {
      const next = schedule.nextOccurrence ?? schedule.startDate;
      return !next || next >= new Date();
    });

    const completed = asset.maintenanceHistories.length;
    const verified = asset.maintenanceHistories.filter((history) => history.verified).length;
    const totalMaintenanceCost = asset.maintenanceHistories.reduce((sum, history) => sum + (history.cost ?? 0), 0);
    const lastLocation = asset.locationHistory[0] ?? null;

    const warrantyStatus = await this.getWarrantyStatus(id);
    const nextInventoryCheck = asset.nextInventoryCheck ?? asset.lastInventoryCheck ?? null;
    const inventoryState =
      nextInventoryCheck && nextInventoryCheck.getTime() < Date.now()
        ? 'OVERDUE'
        : nextInventoryCheck
          ? 'SCHEDULED'
          : 'MISSING';

    return {
      asset,
      metrics: {
        maintenanceCount: asset.maintenanceSchedules.length,
        completedReports: completed,
        verifiedReports: verified,
        upcomingCount: upcoming.length,
        totalMaintenanceCost,
      },
      warranty: warrantyStatus,
      lifecycle: {
        replacementRecommended: asset.replacementRecommended,
        replacementNotes: asset.replacementNotes,
        inventoryStatus: asset.inventoryStatus,
        lastInventoryCheck: asset.lastInventoryCheck,
        nextInventoryCheck: asset.nextInventoryCheck,
        inventoryState,
      },
      upcoming,
      lastLocation,
    };
  }

  async verifyInventory(
    id: number,
    input: {
      notes?: string;
      nextInventoryCheck?: string | null;
      replacementRecommended?: boolean;
      replacementNotes?: string | null;
    },
  ) {
    return this.prisma.asset.update({
      where: { id },
      data: {
        lastInventoryCheck: new Date(),
        nextInventoryCheck: input.nextInventoryCheck ? new Date(input.nextInventoryCheck) : input.nextInventoryCheck === null ? null : undefined,
        inventoryStatus: 'VERIFIED',
        replacementRecommended: input.replacementRecommended,
        replacementNotes: input.replacementNotes === undefined ? input.notes : input.replacementNotes,
      },
      include: this.include,
    });
  }

  async getLifecycleSummary(buildingId?: number) {
    const assets = await this.prisma.asset.findMany({
      where: buildingId ? { buildingId } : {},
      include: {
        building: true,
        maintenanceHistories: true,
        maintenanceSchedules: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const items = assets.map((asset) => {
      const maintenanceCost = asset.maintenanceHistories.reduce((sum, row) => sum + (row.cost ?? 0), 0);
      const warrantyState =
        !asset.warrantyExpiry ? 'NONE' : asset.warrantyExpiry < now ? 'EXPIRED' : asset.warrantyExpiry <= inThirtyDays ? 'EXPIRING' : 'ACTIVE';
      const inventoryState =
        !asset.nextInventoryCheck && !asset.lastInventoryCheck
          ? 'MISSING'
          : asset.nextInventoryCheck && asset.nextInventoryCheck < now
            ? 'OVERDUE'
            : 'CURRENT';

      return {
        id: asset.id,
        name: asset.name,
        buildingId: asset.buildingId,
        buildingName: asset.building.name,
        category: asset.category,
        status: asset.status,
        value: asset.value,
        warrantyExpiry: asset.warrantyExpiry,
        warrantyState,
        inventoryState,
        lastInventoryCheck: asset.lastInventoryCheck,
        nextInventoryCheck: asset.nextInventoryCheck,
        replacementRecommended: asset.replacementRecommended,
        replacementNotes: asset.replacementNotes,
        maintenanceCost,
        openMaintenance: asset.maintenanceSchedules.filter((schedule) => !schedule.completionVerified).length,
      };
    });

    return {
      buildingId: buildingId ?? null,
      summary: {
        totalAssets: items.length,
        expiringWarranty: items.filter((item) => item.warrantyState === 'EXPIRING').length,
        expiredWarranty: items.filter((item) => item.warrantyState === 'EXPIRED').length,
        replacementRecommended: items.filter((item) => item.replacementRecommended).length,
        overdueInventoryChecks: items.filter((item) => item.inventoryState === 'OVERDUE').length,
        totalMaintenanceCost: items.reduce((sum, item) => sum + (item.maintenanceCost ?? 0), 0),
      },
      items: items.sort((a, b) => (b.maintenanceCost ?? 0) - (a.maintenanceCost ?? 0)),
    };
  }
}
