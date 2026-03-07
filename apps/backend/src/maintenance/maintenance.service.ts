import { Injectable } from '@nestjs/common';
import { MaintenancePriority, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { NotificationService, NotificationTemplate } from '../notifications/notification.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto';
import { VerifyMaintenanceDto } from './dto/verify-maintenance.dto';

type TransactionClient = Prisma.TransactionClient;

type ScheduleInclude = Prisma.MaintenanceScheduleInclude;

@Injectable()
export class MaintenanceService {
  private readonly scheduleInclude: ScheduleInclude = {
    building: true,
    asset: true,
    assignedTo: true,
    communications: true,
    teamMembers: { include: { user: true } },
    histories: {
      include: { performedBy: true, verifiedBy: true, asset: true },
      orderBy: { performedAt: 'desc' },
    },
  };

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  private async notifyScheduleParticipants(
    scheduleId: number,
    title: string,
    description: string,
    date: Date | null | undefined,
  ) {
    const schedule = await this.prisma.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        building: true,
        assignedTo: true,
        teamMembers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!schedule) {
      return;
    }

    const userIds = Array.from(
      new Set([
        ...(schedule.assignedToId ? [schedule.assignedToId] : []),
        ...schedule.teamMembers.map((member) => member.userId),
      ]),
    );

    const when = date ?? schedule.nextOccurrence ?? schedule.startDate;
    const formattedDate = when.toLocaleDateString('he-IL');
    const formattedTime = when.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    await Promise.all(
      userIds.map((userId) =>
        this.notifications.notifyUser(userId, NotificationTemplate.MAINTENANCE_REMINDER, {
          title,
          description,
          date: formattedDate,
          time: formattedTime,
          buildingName: schedule.building.name,
        }),
      ),
    );
  }

  private normalizeRule(recurrenceRule?: string, frequency?: string) {
    const source = recurrenceRule?.trim() || frequency?.trim();
    if (!source) {
      return undefined;
    }
    return source.replace(/\s+/g, '_').toUpperCase();
  }

  private calculateNextOccurrence(startDate: Date, recurrenceRule?: string, referenceDate?: Date) {
    const normalized = this.normalizeRule(recurrenceRule);
    if (!normalized) {
      return undefined;
    }

    const base = new Date(referenceDate ?? startDate);

    const advanceDays = (days: number) => {
      const next = new Date(base);
      next.setDate(next.getDate() + days);
      return next;
    };

    const advanceMonths = (months: number) => {
      const next = new Date(base);
      next.setMonth(next.getMonth() + months);
      return next;
    };

    switch (normalized) {
      case 'DAILY':
        return advanceDays(1);
      case 'WEEKLY':
        return advanceDays(7);
      case 'BIWEEKLY':
      case 'BI-WEEKLY':
        return advanceDays(14);
      case 'MONTHLY':
        return advanceMonths(1);
      case 'QUARTERLY':
        return advanceMonths(3);
      case 'SEMIANNUAL':
      case 'SEMI_ANNUAL':
        return advanceMonths(6);
      case 'ANNUAL':
      case 'YEARLY':
        return advanceMonths(12);
      default: {
        const everyDays = normalized.match(/^EVERY_(\d+)_DAYS$/);
        if (everyDays) {
          const value = Number.parseInt(everyDays[1], 10);
          if (value > 0) {
            return advanceDays(value);
          }
        }
        return undefined;
      }
    }
  }

  private mapCreateDto(dto: CreateMaintenanceDto): Prisma.MaintenanceScheduleCreateInput {
    const {
      buildingId,
      assetId,
      assignedToId,
      startDate,
      nextOccurrence,
      recurrenceRule,
      priority,
      estimatedCost,
      completionNotes,
      teamMemberIds: _teamMemberIds,
      ...rest
    } = dto;
    const normalizedRule = this.normalizeRule(recurrenceRule, dto.frequency);
    const start = new Date(startDate);
    const calculatedNext =
      nextOccurrence !== undefined && nextOccurrence !== null
        ? new Date(nextOccurrence)
        : this.calculateNextOccurrence(start, normalizedRule);

    return {
      ...rest,
      recurrenceRule: normalizedRule,
      priority: priority ?? MaintenancePriority.MEDIUM,
      estimatedCost,
      completionNotes,
      startDate: start,
      nextOccurrence: calculatedNext,
      building: { connect: { id: buildingId } },
      asset: assetId ? { connect: { id: assetId } } : undefined,
      assignedTo: assignedToId ? { connect: { id: assignedToId } } : undefined,
    };
  }

  private mapUpdateDto(dto: UpdateMaintenanceDto): Prisma.MaintenanceScheduleUpdateInput {
    const {
      buildingId,
      assetId,
      assignedToId,
      startDate,
      nextOccurrence,
      teamMemberIds: _teamMemberIds,
      priority,
      estimatedCost,
      completionNotes,
      completionVerified,
      verifiedAt,
      verifiedById,
      recurrenceRule,
      ...rest
    } = dto;

    const normalizedRule = recurrenceRule !== undefined ? this.normalizeRule(recurrenceRule, dto.frequency) : undefined;

    const data: Prisma.MaintenanceScheduleUpdateInput = {
      ...rest,
      recurrenceRule: normalizedRule,
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

    if (priority !== undefined) {
      data.priority = priority;
    }

    if (estimatedCost !== undefined) {
      data.estimatedCost = estimatedCost;
    }

    if (completionNotes !== undefined) {
      data.completionNotes = completionNotes;
    }

    if (completionVerified !== undefined) {
      data.completionVerified = completionVerified;
      if (!completionVerified) {
        data.verifiedBy = { disconnect: true };
        data.verifiedAt = null;
      }
    }

    if (verifiedAt) {
      data.verifiedAt = new Date(verifiedAt);
    }

    if (verifiedById !== undefined) {
      data.verifiedBy = verifiedById ? { connect: { id: verifiedById } } : { disconnect: true };
    }

    return data;
  }

  private async syncTeamMembers(client: TransactionClient, scheduleId: number, memberIds?: number[]) {
    if (memberIds === undefined) {
      return;
    }

    const uniqueIds = Array.from(new Set(memberIds));

    await client.maintenanceTeamMember.deleteMany({
      where: { scheduleId, userId: { notIn: uniqueIds } },
    });

    if (!uniqueIds.length) {
      return;
    }

    const existing = await client.maintenanceTeamMember.findMany({
      where: { scheduleId },
      select: { userId: true },
    });

    const existingIds = new Set(existing.map((member) => member.userId));
    const toCreate = uniqueIds.filter((id) => !existingIds.has(id));

    if (toCreate.length) {
      await client.maintenanceTeamMember.createMany({
        data: toCreate.map((userId) => ({ scheduleId, userId })),
        skipDuplicates: true,
      });
    }
  }

  private findOneQuery(id: number) {
    return {
      where: { id },
      include: this.scheduleInclude,
    } satisfies Prisma.MaintenanceScheduleFindUniqueArgs;
  }

  async create(dto: CreateMaintenanceDto) {
    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.maintenanceSchedule.create({
        data: this.mapCreateDto(dto),
        include: this.scheduleInclude,
      });

      await this.syncTeamMembers(tx, schedule.id, dto.teamMemberIds);
      const fullSchedule = await this.findOneWithClient(schedule.id, tx);
      await this.notifyScheduleParticipants(
        schedule.id,
        fullSchedule.title,
        fullSchedule.description ?? `משימת תחזוקה ${fullSchedule.category}`,
        fullSchedule.nextOccurrence ?? fullSchedule.startDate,
      );
      return fullSchedule;
    });
  }

  findAll() {
    return this.prisma.maintenanceSchedule.findMany({
      include: this.scheduleInclude,
      orderBy: { startDate: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.maintenanceSchedule.findUnique(this.findOneQuery(id));
  }

  findByBuilding(buildingId: number) {
    return this.prisma.maintenanceSchedule.findMany({
      where: { buildingId },
      include: this.scheduleInclude,
      orderBy: { nextOccurrence: 'asc' },
    });
  }

  async update(id: number, dto: UpdateMaintenanceDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.maintenanceSchedule.update({
        where: { id },
        data: this.mapUpdateDto(dto),
      });

      await this.syncTeamMembers(tx, id, dto.teamMemberIds);

      return this.findOneWithClient(id, tx);
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
      include: this.scheduleInclude,
      orderBy: { startDate: 'asc' },
    });
  }

  async getAlerts(buildingId: number, daysAhead = 7) {
    const start = new Date();
    const end = new Date(start.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return this.prisma.maintenanceSchedule.findMany({
      where: {
        buildingId,
        OR: [
          { nextOccurrence: { gte: start, lte: end } },
          { nextOccurrence: null, startDate: { gte: start, lte: end } },
        ],
      },
      include: this.scheduleInclude,
      orderBy: { nextOccurrence: 'asc' },
    });
  }

  async recordCompletion(id: number, dto: CompleteMaintenanceDto) {
    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.maintenanceSchedule.findUnique({ where: { id } });
      if (!schedule) {
        throw new Error('Maintenance schedule not found');
      }

      const performedAt = new Date(dto.performedAt);

      await tx.maintenanceHistory.create({
        data: {
          schedule: { connect: { id } },
          asset: schedule.assetId ? { connect: { id: schedule.assetId } } : undefined,
          performedAt,
          notes: dto.notes,
          cost: dto.cost,
          performedBy: dto.performedById ? { connect: { id: dto.performedById } } : undefined,
        },
      });

      const normalizedRule = this.normalizeRule(
        schedule.recurrenceRule ?? undefined,
        schedule.frequency,
      );
      const nextOccurrence = this.calculateNextOccurrence(performedAt, normalizedRule);

      await tx.maintenanceSchedule.update({
        where: { id },
        data: {
          lastCompleted: performedAt,
          completionNotes: dto.notes ?? schedule.completionNotes,
          completionVerified: false,
          verifiedBy: { disconnect: true },
          verifiedAt: null,
          nextOccurrence: nextOccurrence ?? schedule.nextOccurrence,
        },
      });

      const updated = await this.findOneWithClient(id, tx);
      await this.notifyScheduleParticipants(
        id,
        `${updated.title} הושלמה`,
        dto.notes ?? updated.description ?? 'משימת התחזוקה הושלמה וממתינה לאימות',
        nextOccurrence ?? updated.nextOccurrence ?? updated.startDate,
      );
      return updated;
    });
  }

  async verifyCompletion(id: number, dto: VerifyMaintenanceDto) {
    return this.prisma.$transaction(async (tx) => {
      const history = await tx.maintenanceHistory.findUnique({ where: { id: dto.historyId } });

      if (!history || history.scheduleId !== id) {
        throw new Error('Maintenance history not found for schedule');
      }

      const verified = dto.verified ?? true;
      const verifiedAt = dto.verifiedAt ? new Date(dto.verifiedAt) : new Date();

      await tx.maintenanceHistory.update({
        where: { id: dto.historyId },
        data: {
          verified,
          verifiedAt: verified ? verifiedAt : null,
          verificationNotes: dto.notes,
          verifiedBy: dto.verifiedById
            ? { connect: { id: dto.verifiedById } }
            : verified
            ? undefined
            : { disconnect: true },
        },
      });

      await tx.maintenanceSchedule.update({
        where: { id },
        data: {
          completionVerified: verified,
          verifiedAt: verified ? verifiedAt : null,
          verifiedBy: dto.verifiedById
            ? { connect: { id: dto.verifiedById } }
            : verified
            ? undefined
            : { disconnect: true },
        },
      });

      const updated = await this.findOneWithClient(id, tx);
      if (verified) {
        await this.notifyScheduleParticipants(
          id,
          `${updated.title} אומתה`,
          dto.notes ?? 'השלמת התחזוקה אומתה בהצלחה',
          updated.nextOccurrence ?? updated.startDate,
        );
      }
      return updated;
    });
  }

  getHistory(scheduleId: number) {
    return this.prisma.maintenanceHistory.findMany({
      where: { scheduleId },
      include: { performedBy: true, verifiedBy: true, asset: true },
      orderBy: { performedAt: 'desc' },
    });
  }

  async getCostProjection(buildingId: number, monthsAhead = 3) {
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + monthsAhead);

    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where: {
        buildingId,
        OR: [
          { nextOccurrence: { gte: start, lte: end } },
          { nextOccurrence: null, startDate: { gte: start, lte: end } },
        ],
      },
      select: {
        id: true,
        title: true,
        priority: true,
        estimatedCost: true,
        nextOccurrence: true,
        startDate: true,
      },
      orderBy: { nextOccurrence: 'asc' },
    });

    const totalEstimatedCost = schedules.reduce((sum, schedule) => sum + (schedule.estimatedCost ?? 0), 0);

    const byPriority = schedules.reduce(
      (acc, schedule) => {
        const key = schedule.priority ?? MaintenancePriority.MEDIUM;
        if (!acc[key]) {
          acc[key] = { count: 0, estimatedCost: 0 };
        }
        acc[key].count += 1;
        acc[key].estimatedCost += schedule.estimatedCost ?? 0;
        return acc;
      },
      {} as Record<MaintenancePriority, { count: number; estimatedCost: number }>,
    );

    return {
      buildingId,
      range: { start, end },
      totalEstimatedCost,
      byPriority,
      schedules,
    };
  }

  private async findOneWithClient(id: number, client: TransactionClient) {
    return client.maintenanceSchedule.findUniqueOrThrow(this.findOneQuery(id));
  }
}
