import { Injectable } from '@nestjs/common';
import { ActivitySeverity, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type LogActivityInput = {
  userId?: number | null;
  buildingId?: number | null;
  residentId?: number | null;
  entityType: string;
  entityId?: number | null;
  action: string;
  summary: string;
  severity?: ActivitySeverity;
  metadata?: Prisma.InputJsonValue;
};

type ListActivityInput = {
  buildingId?: number;
  residentId?: number;
  entityType?: string;
  severity?: ActivitySeverity;
  limit?: number;
};

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  log(input: LogActivityInput) {
    return this.prisma.activityLog.create({
      data: {
        userId: input.userId ?? undefined,
        buildingId: input.buildingId ?? undefined,
        residentId: input.residentId ?? undefined,
        entityType: input.entityType,
        entityId: input.entityId ?? undefined,
        action: input.action,
        summary: input.summary,
        severity: input.severity ?? ActivitySeverity.INFO,
        metadata: input.metadata,
      },
    });
  }

  async list(input: ListActivityInput) {
    const rows = await this.prisma.activityLog.findMany({
      where: {
        ...(input.buildingId ? { buildingId: input.buildingId } : {}),
        ...(input.residentId ? { residentId: input.residentId } : {}),
        ...(input.entityType ? { entityType: input.entityType } : {}),
        ...(input.severity ? { severity: input.severity } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        building: {
          select: {
            id: true,
            name: true,
          },
        },
        resident: {
          select: {
            id: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: input.limit ?? 100,
    });

    return rows.map((row) => ({
      ...row,
      actor: row.user?.email ?? 'System',
      buildingName: row.building?.name ?? null,
      residentName: row.resident?.user?.email ?? null,
    }));
  }

  async exportCsv(input: ListActivityInput) {
    const rows = await this.list(input);
    return [
      'createdAt,severity,action,entityType,entityId,actor,building,resident,summary',
      ...rows.map((row) =>
        [
          row.createdAt.toISOString(),
          row.severity,
          row.action,
          row.entityType,
          row.entityId ?? '',
          JSON.stringify(row.actor),
          JSON.stringify(row.buildingName ?? ''),
          JSON.stringify(row.residentName ?? ''),
          JSON.stringify(row.summary),
        ].join(','),
      ),
    ].join('\n');
  }
}
