import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ActivityService } from '../activity/activity.service';
import { Prisma, Building, TicketStatus, BuildingCode, ActivitySeverity } from '@prisma/client';
import { CreateBuildingCodeDto, UpdateBuildingCodeDto } from './dto/building-code.dto';

@Injectable()
export class BuildingService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

  create(data: Prisma.BuildingCreateInput): Promise<Building> {
    return this.prisma.building.create({ data });
  }

  findAll(): Promise<Building[]> {
    return this.prisma.building.findMany();
  }

  findOne(id: number): Promise<Building | null> {
    return this.prisma.building.findUnique({ where: { id } });
  }

  listUnits(id: number) {
    return this.prisma.unit.findMany({
      where: { buildingId: id },
      select: {
        id: true,
        number: true,
        floor: true,
      },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    });
  }

  findDetailed(id: number) {
    return this.prisma.building.findUnique({
      where: { id },
      include: {
        units: true,
        maintenanceSchedules: {
          include: {
            asset: true,
            assignedTo: true,
          },
          orderBy: { nextOccurrence: 'asc' },
        },
        budgets: {
          include: { expenses: true },
          orderBy: { year: 'desc' },
        },
        expenses: true,
        documents: true,
        assets: {
          include: { maintenanceSchedules: true },
        },
        contracts: {
          include: { supplier: true, documents: true },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        communications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async getOverview(id: number) {
    const [building, openTickets, schedulesCount, assetsCount, activeContracts] = await Promise.all([
      this.prisma.building.findUnique({ where: { id }, include: { units: true } }),
      this.prisma.ticket.count({
        where: {
          unit: { buildingId: id },
          status: { not: TicketStatus.RESOLVED },
        },
      }),
      this.prisma.maintenanceSchedule.count({ where: { buildingId: id } }),
      this.prisma.asset.count({ where: { buildingId: id } }),
      this.prisma.contract.count({
        where: {
          buildingId: id,
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      }),
    ]);

    if (!building) {
      return null;
    }

    const [budgetTotals, expenseTotals, upcomingMaintenance] = await Promise.all([
      this.prisma.budget.aggregate({
        _sum: { amount: true, actualSpent: true },
        where: { buildingId: id },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { buildingId: id },
      }),
      this.getUpcomingMaintenance(id, 5),
    ]);

    return {
      building,
      metrics: {
        totalUnits: building.totalUnits ?? building.units?.length ?? 0,
        openTickets,
        activeMaintenanceSchedules: schedulesCount,
        assetCount: assetsCount,
        activeContracts,
      },
      financial: {
        planned: budgetTotals._sum.amount ?? 0,
        actual: budgetTotals._sum.actualSpent ?? expenseTotals._sum.amount ?? 0,
        variance:
          (budgetTotals._sum.amount ?? 0) -
          (budgetTotals._sum.actualSpent ?? expenseTotals._sum.amount ?? 0),
      },
      upcomingMaintenance,
    };
  }

  getUpcomingMaintenance(id: number, take = 5) {
    return this.prisma.maintenanceSchedule.findMany({
      where: { buildingId: id },
      include: {
        asset: true,
        assignedTo: true,
      },
      orderBy: {
        nextOccurrence: 'asc',
      },
      take,
    });
  }

  async getFinancialSummary(id: number) {
    const budgets = await this.prisma.budget.findMany({
      where: { buildingId: id },
      include: { expenses: true },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });

    const totals = budgets.reduce(
      (acc, budget) => {
        acc.planned += budget.amount;
        acc.actual += budget.actualSpent;
        return acc;
      },
      { planned: 0, actual: 0 },
    );

    const expensesByCategory = await this.prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: { buildingId: id },
    });

    return {
      budgets,
      totals: {
        planned: totals.planned,
        actual: totals.actual,
        variance: totals.planned - totals.actual,
      },
      expensesByCategory,
    };
  }

  update(id: number, data: Prisma.BuildingUpdateInput): Promise<Building> {
    return this.prisma.building.update({ where: { id }, data });
  }

  remove(id: number): Promise<Building> {
    return this.prisma.building.delete({ where: { id } });
  }

  // Building Code Management
  async getBuildingCodes(buildingId: number): Promise<BuildingCode[]> {
    return this.prisma.buildingCode.findMany({
      where: { buildingId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { codeType: 'asc' }],
    });
  }

  async createBuildingCode(
    buildingId: number,
    dto: CreateBuildingCodeDto,
    createdBy: number,
  ): Promise<BuildingCode> {
    const code = await this.prisma.buildingCode.create({
      data: {
        buildingId,
        codeType: dto.codeType,
        code: dto.code,
        description: dto.description,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    await this.activity.log({
      userId: createdBy,
      buildingId,
      entityType: 'BUILDING_CODE',
      entityId: code.id,
      action: 'BUILDING_CODE_CREATED',
      summary: `נוצר קוד בניין חדש מסוג ${code.codeType}.`,
      severity: ActivitySeverity.WARNING,
      metadata: { codeType: code.codeType, hasExpiry: !!code.validUntil },
    });
    return code;
  }

  async updateBuildingCode(
    codeId: number,
    dto: UpdateBuildingCodeDto,
    actorUserId?: number,
  ): Promise<BuildingCode> {
    const updateData: Prisma.BuildingCodeUpdateInput = {};
    
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.validUntil !== undefined) {
      updateData.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    }

    const code = await this.prisma.buildingCode.update({
      where: { id: codeId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    await this.activity.log({
      userId: actorUserId,
      buildingId: code.buildingId,
      entityType: 'BUILDING_CODE',
      entityId: code.id,
      action: 'BUILDING_CODE_UPDATED',
      summary: `עודכן קוד בניין מסוג ${code.codeType}.`,
      severity: ActivitySeverity.WARNING,
      metadata: {
        isActive: code.isActive,
        validUntil: code.validUntil?.toISOString() ?? null,
        fields: Object.keys(updateData),
      },
    });
    return code;
  }

  async deleteBuildingCode(codeId: number, actorUserId?: number): Promise<BuildingCode> {
    const code = await this.prisma.buildingCode.delete({
      where: { id: codeId },
    });
    await this.activity.log({
      userId: actorUserId,
      buildingId: code.buildingId,
      entityType: 'BUILDING_CODE',
      entityId: code.id,
      action: 'BUILDING_CODE_DELETED',
      summary: `נמחק קוד בניין מסוג ${code.codeType}.`,
      severity: ActivitySeverity.CRITICAL,
      metadata: { codeType: code.codeType },
    });
    return code;
  }

  async deactivateExpiredCodes(): Promise<number> {
    const result = await this.prisma.buildingCode.updateMany({
      where: {
        isActive: true,
        validUntil: {
          lt: new Date(),
        },
      },
      data: {
        isActive: false,
      },
    });
    return result.count;
  }
}
