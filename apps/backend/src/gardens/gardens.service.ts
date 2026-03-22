import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivitySeverity,
  GardensPlanStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import {
  CreateGardensMonthDto,
  GardensAssignmentInputDto,
  ReviewGardensPlanDto,
  SendGardensRemindersDto,
} from './dto/gardens.dto';

type AuthUser = {
  sub: number;
  tenantId: number;
  role: Role | string;
  actAsRole?: Role | string;
};

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class GardensService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

  private readonly managerRoles = new Set<Role>([Role.ADMIN, Role.PM, Role.MASTER]);

  private normalizeRole(user: AuthUser): Role | null {
    const role = user.actAsRole ?? user.role;
    return Object.values(Role).includes(role as Role) ? (role as Role) : null;
  }

  private ensureManager(user: AuthUser) {
    const role = this.normalizeRole(user);
    if (!role || !this.managerRoles.has(role)) {
      throw new ForbiddenException('Gardens management is available only to management roles.');
    }
  }

  private ensureWorker(user: AuthUser) {
    const role = this.normalizeRole(user);
    if (role !== Role.TECH) {
      throw new ForbiddenException('Gardens worker workspace is available only to technicians.');
    }
  }

  private parsePlanKey(plan: string) {
    const match = plan.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
    if (!match) {
      throw new BadRequestException('Invalid plan key. Expected YYYY-MM.');
    }

    return {
      year: Number.parseInt(match[1], 10),
      month: Number.parseInt(match[2], 10),
      plan,
    };
  }

  private formatPlanKey(year: number, month: number) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private normalizeDate(date: string) {
    const iso = `${date}T00:00:00.000Z`;
    const value = new Date(iso);
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestException(`Invalid assignment date: ${date}`);
    }
    return value;
  }

  private prettifyEmail(email: string) {
    const local = email.split('@')[0] ?? email;
    return local
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private async syncWorkerProfiles(tenantId: number) {
    const techUsers = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: Role.TECH,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        gardensWorkerProfile: {
          select: {
            id: true,
            displayName: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        email: 'asc',
      },
    });

    for (const user of techUsers) {
      const displayName =
        user.gardensWorkerProfile?.displayName?.trim() || this.prettifyEmail(user.email);

      if (user.gardensWorkerProfile) {
        await this.prisma.gardensWorkerProfile.update({
          where: { id: user.gardensWorkerProfile.id },
          data: {
            displayName,
          },
        });
        continue;
      }

      await this.prisma.gardensWorkerProfile.create({
        data: {
          userId: user.id,
          displayName,
          isActive: true,
        },
      });
    }
  }

  private async getWorkerProfileByUserId(userId: number) {
    return this.prisma.gardensWorkerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            tenantId: true,
          },
        },
      },
    });
  }

  private async getMonthOrThrow(tenantId: number, plan: string) {
    const { year, month } = this.parsePlanKey(plan);
    const monthRecord = await this.prisma.gardensMonth.findUnique({
      where: {
        tenantId_year_month: {
          tenantId,
          year,
          month,
        },
      },
    });

    if (!monthRecord) {
      throw new NotFoundException('Gardens month not found.');
    }

    return monthRecord;
  }

  private async ensureWorkerPlans(
    tx: TransactionClient,
    monthId: number,
    workerProfileIds: number[],
  ) {
    if (!workerProfileIds.length) {
      return;
    }

    const existing = await tx.gardensWorkerPlan.findMany({
      where: { monthId, workerProfileId: { in: workerProfileIds } },
      select: { workerProfileId: true },
    });
    const existingIds = new Set(existing.map((item) => item.workerProfileId));

    const missing = workerProfileIds.filter((workerProfileId) => !existingIds.has(workerProfileId));
    if (!missing.length) {
      return;
    }

    await tx.gardensWorkerPlan.createMany({
      data: missing.map((workerProfileId) => ({
        monthId,
        workerProfileId,
        status: GardensPlanStatus.DRAFT,
      })),
      skipDuplicates: true,
    });
  }

  private async hydrateMonthSummary(tenantId: number) {
    const months = await this.prisma.gardensMonth.findMany({
      where: { tenantId },
      include: {
        workerPlans: {
          include: {
            assignments: {
              select: {
                id: true,
                workDate: true,
              },
            },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return months.map((month) => {
      const workers = month.workerPlans.length;
      const submitted = month.workerPlans.filter(
        (plan) =>
          plan.status === GardensPlanStatus.SUBMITTED ||
          plan.status === GardensPlanStatus.APPROVED,
      ).length;
      const approved = month.workerPlans.filter((plan) => plan.status === GardensPlanStatus.APPROVED).length;
      const needsChanges = month.workerPlans.filter(
        (plan) => plan.status === GardensPlanStatus.NEEDS_CHANGES,
      ).length;
      const assignmentCount = month.workerPlans.reduce(
        (sum, plan) => sum + plan.assignments.length,
        0,
      );
      const coverageDays = new Set(
        month.workerPlans.flatMap((plan) =>
          plan.assignments.map((assignment) => assignment.workDate.toISOString().slice(0, 10)),
        ),
      ).size;

      return {
        id: month.id,
        plan: this.formatPlanKey(month.year, month.month),
        year: month.year,
        month: month.month,
        title: month.title,
        submissionDeadline: month.submissionDeadline,
        isLocked: month.isLocked,
        createdAt: month.createdAt,
        stats: {
          workers,
          submitted,
          approved,
          needsChanges,
          assignments: assignmentCount,
          coverageDays,
        },
      };
    });
  }

  private async notifyManagersAboutSubmission(
    tenantId: number,
    workerName: string,
    planKey: string,
    workerPlanId: number,
  ) {
    const managers = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: [Role.ADMIN, Role.PM, Role.MASTER] },
      },
      select: {
        id: true,
      },
    });

    if (!managers.length) {
      return;
    }

    await this.prisma.notification.createMany({
      data: managers.map((manager) => ({
        tenantId,
        userId: manager.id,
        title: 'תוכנית גינון הוגשה לאישור',
        message: `${workerName} הגיש את תוכנית העבודה עבור ${planKey}.`,
        type: 'GARDENS_PLAN_SUBMITTED',
        metadata: {
          workerPlanId,
          workerName,
          plan: planKey,
        },
      })),
    });
  }

  private async notifyWorkerAboutReview(
    tenantId: number,
    userId: number,
    planKey: string,
    status: GardensPlanStatus,
    reviewNote?: string | null,
  ) {
    const title =
      status === GardensPlanStatus.APPROVED
        ? 'תוכנית הגינון אושרה'
        : 'נדרשים שינויים בתוכנית הגינון';
    const message =
      status === GardensPlanStatus.APPROVED
        ? `התוכנית עבור ${planKey} אושרה ונסגרה.`
        : `התוכנית עבור ${planKey} הוחזרה לעדכון.${reviewNote ? ` הערה: ${reviewNote}` : ''}`;

    await this.prisma.notification.create({
      data: {
        tenantId,
        userId,
        title,
        message,
        type: 'GARDENS_PLAN_REVIEWED',
        metadata: {
          plan: planKey,
          status,
          reviewNote: reviewNote ?? null,
        },
      },
    });
  }

  async listMonths(user: AuthUser) {
    this.ensureManager(user);
    await this.syncWorkerProfiles(user.tenantId);
    return this.hydrateMonthSummary(user.tenantId);
  }

  async getManagerDashboard(user: AuthUser) {
    const months = await this.listMonths(user);
    const activeMonth = months.find((month) => !month.isLocked) ?? months[0] ?? null;

    return {
      summary: {
        totalMonths: months.length,
        activeWorkers: activeMonth?.stats.workers ?? 0,
        pendingApprovals: months.reduce((sum, month) => sum + Math.max(month.stats.submitted - month.stats.approved, 0), 0),
        requiresAttention: months.reduce((sum, month) => sum + month.stats.needsChanges, 0),
      },
      activeMonth: activeMonth
        ? {
            month: activeMonth.plan,
            isLocked: activeMonth.isLocked,
            submitted: Math.max(activeMonth.stats.submitted - activeMonth.stats.approved, 0),
            needsChanges: activeMonth.stats.needsChanges,
          }
        : null,
    };
  }

  async listWorkers(user: AuthUser) {
    this.ensureManager(user);
    await this.syncWorkerProfiles(user.tenantId);

    const workers = await this.prisma.gardensWorkerProfile.findMany({
      where: {
        user: {
          tenantId: user.tenantId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { displayName: 'asc' }],
    });

    return workers.map((worker) => ({
      id: worker.id,
      displayName: worker.displayName,
      teamName: worker.teamName,
      isActive: worker.isActive,
      user: worker.user,
    }));
  }

  async createMonth(user: AuthUser, dto: CreateGardensMonthDto) {
    this.ensureManager(user);
    await this.syncWorkerProfiles(user.tenantId);
    const { year, month, plan } = this.parsePlanKey(dto.plan);

    const result = await this.prisma.$transaction(async (tx) => {
      const monthRecord = await tx.gardensMonth.upsert({
        where: {
          tenantId_year_month: {
            tenantId: user.tenantId,
            year,
            month,
          },
        },
        update: {
          title: dto.title ?? undefined,
          submissionDeadline: dto.submissionDeadline ? new Date(dto.submissionDeadline) : undefined,
        },
        create: {
          tenantId: user.tenantId,
          year,
          month,
          title: dto.title,
          submissionDeadline: dto.submissionDeadline
            ? new Date(dto.submissionDeadline)
            : undefined,
          createdById: user.sub,
        },
      });

      const workerProfiles = await tx.gardensWorkerProfile.findMany({
        where: {
          isActive: true,
          user: {
            tenantId: user.tenantId,
            role: Role.TECH,
          },
        },
        select: {
          id: true,
        },
      });

      await this.ensureWorkerPlans(
        tx,
        monthRecord.id,
        workerProfiles.map((worker) => worker.id),
      );

      return monthRecord;
    });

    await this.activity.log({
      userId: user.sub,
      entityType: 'GARDENS_MONTH',
      entityId: result.id,
      action: 'GARDENS_MONTH_UPSERTED',
      summary: `חודש הגינון ${plan} הוכן במערכת.`,
      severity: ActivitySeverity.INFO,
      metadata: { plan },
    });

    return {
      id: result.id,
      plan,
      year: result.year,
      month: result.month,
      title: result.title,
      submissionDeadline: result.submissionDeadline,
      isLocked: result.isLocked,
    };
  }

  async getMonthDashboard(user: AuthUser, plan: string) {
    this.ensureManager(user);
    const monthRecord = await this.getMonthOrThrow(user.tenantId, plan);

    const month = await this.prisma.gardensMonth.findUnique({
      where: { id: monthRecord.id },
      include: {
        workerPlans: {
          include: {
            workerProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            reviewedBy: {
              select: {
                id: true,
                email: true,
              },
            },
            assignments: {
              orderBy: [{ workDate: 'asc' }],
            },
          },
          orderBy: [{ workerProfile: { displayName: 'asc' } }],
        },
      },
    });

    if (!month) {
      throw new NotFoundException('Gardens month not found.');
    }

    const stats = {
      workers: month.workerPlans.length,
      submitted: month.workerPlans.filter(
        (planItem) =>
          planItem.status === GardensPlanStatus.SUBMITTED ||
          planItem.status === GardensPlanStatus.APPROVED,
      ).length,
      approved: month.workerPlans.filter((planItem) => planItem.status === GardensPlanStatus.APPROVED).length,
      needsChanges: month.workerPlans.filter(
        (planItem) => planItem.status === GardensPlanStatus.NEEDS_CHANGES,
      ).length,
      assignments: month.workerPlans.reduce(
        (sum, planItem) => sum + planItem.assignments.length,
        0,
      ),
      coverageDays: new Set(
        month.workerPlans.flatMap((planItem) =>
          planItem.assignments.map((assignment) => assignment.workDate.toISOString().slice(0, 10)),
        ),
      ).size,
    };

    return {
      month: {
        id: month.id,
        plan,
        title: month.title,
        submissionDeadline: month.submissionDeadline,
        isLocked: month.isLocked,
        createdAt: month.createdAt,
      },
      stats,
      workers: month.workerPlans.map((planItem) => ({
        workerProfileId: planItem.workerProfileId,
        userId: planItem.workerProfile.userId,
        displayName: planItem.workerProfile.displayName,
        teamName: planItem.workerProfile.teamName,
        email: planItem.workerProfile.user.email,
        phone: planItem.workerProfile.user.phone,
        status: planItem.status,
        assignmentCount: planItem.assignments.length,
        submittedAt: planItem.submittedAt,
        reviewedAt: planItem.reviewedAt,
        reviewedBy: planItem.reviewedBy?.email ?? null,
        reviewNote: planItem.reviewNote,
        lastReminderAt: planItem.lastReminderAt,
      })),
      assignments: month.workerPlans.flatMap((planItem) =>
        planItem.assignments.map((assignment) => ({
          id: assignment.id,
          date: assignment.workDate.toISOString().slice(0, 10),
          location: assignment.location,
          notes: assignment.notes ?? '',
          workerProfileId: planItem.workerProfileId,
          workerName: planItem.workerProfile.displayName,
        })),
      ),
    };
  }

  async getWorkerPlanDetail(user: AuthUser, plan: string, workerProfileId: number) {
    this.ensureManager(user);
    const monthRecord = await this.getMonthOrThrow(user.tenantId, plan);

    const workerPlan = await this.prisma.gardensWorkerPlan.findUnique({
      where: {
        monthId_workerProfileId: {
          monthId: monthRecord.id,
          workerProfileId,
        },
      },
      include: {
        month: true,
        workerProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
          },
        },
        assignments: {
          orderBy: [{ workDate: 'asc' }],
        },
      },
    });

    if (!workerPlan) {
      throw new NotFoundException('Worker plan not found.');
    }

    return {
      month: {
        id: workerPlan.month.id,
        plan,
        title: workerPlan.month.title,
        submissionDeadline: workerPlan.month.submissionDeadline,
        isLocked: workerPlan.month.isLocked,
      },
      worker: {
        workerProfileId: workerPlan.workerProfileId,
        userId: workerPlan.workerProfile.userId,
        displayName: workerPlan.workerProfile.displayName,
        teamName: workerPlan.workerProfile.teamName,
        email: workerPlan.workerProfile.user.email,
        phone: workerPlan.workerProfile.user.phone,
      },
      planState: {
        status: workerPlan.status,
        submittedAt: workerPlan.submittedAt,
        reviewedAt: workerPlan.reviewedAt,
        reviewedBy: workerPlan.reviewedBy?.email ?? null,
        reviewNote: workerPlan.reviewNote,
        lastReminderAt: workerPlan.lastReminderAt,
      },
      assignments: workerPlan.assignments.map((assignment) => ({
        id: assignment.id,
        date: assignment.workDate.toISOString().slice(0, 10),
        location: assignment.location,
        notes: assignment.notes ?? '',
      })),
    };
  }

  async reviewWorkerPlan(
    user: AuthUser,
    plan: string,
    workerProfileId: number,
    dto: ReviewGardensPlanDto,
  ) {
    this.ensureManager(user);
    if (![GardensPlanStatus.APPROVED, GardensPlanStatus.NEEDS_CHANGES].includes(dto.status)) {
      throw new BadRequestException('Invalid review status.');
    }

    const monthRecord = await this.getMonthOrThrow(user.tenantId, plan);
    const workerPlan = await this.prisma.gardensWorkerPlan.findUnique({
      where: {
        monthId_workerProfileId: {
          monthId: monthRecord.id,
          workerProfileId,
        },
      },
      include: {
        workerProfile: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!workerPlan) {
      throw new NotFoundException('Worker plan not found.');
    }

    const updated = await this.prisma.gardensWorkerPlan.update({
      where: { id: workerPlan.id },
      data: {
        status: dto.status,
        reviewNote: dto.reviewNote ?? null,
        reviewedAt: new Date(),
        reviewedById: user.sub,
      },
    });

    await this.notifyWorkerAboutReview(
      user.tenantId,
      workerPlan.workerProfile.user.id,
      plan,
      dto.status,
      dto.reviewNote ?? null,
    );

    await this.activity.log({
      userId: user.sub,
      entityType: 'GARDENS_WORKER_PLAN',
      entityId: updated.id,
      action:
        dto.status === GardensPlanStatus.APPROVED
          ? 'GARDENS_PLAN_APPROVED'
          : 'GARDENS_PLAN_NEEDS_CHANGES',
      summary:
        dto.status === GardensPlanStatus.APPROVED
          ? `תוכנית הגינון ${plan} אושרה.`
          : `תוכנית הגינון ${plan} הוחזרה לשינויים.`,
      severity:
        dto.status === GardensPlanStatus.APPROVED
          ? ActivitySeverity.INFO
          : ActivitySeverity.WARNING,
      metadata: {
        plan,
        workerProfileId,
        reviewNote: dto.reviewNote ?? null,
      },
    });

    return {
      ok: true,
      status: updated.status,
      reviewedAt: updated.reviewedAt,
      reviewNote: updated.reviewNote,
    };
  }

  async sendReminders(
    user: AuthUser,
    plan: string,
    dto: SendGardensRemindersDto,
  ) {
    this.ensureManager(user);
    const monthRecord = await this.getMonthOrThrow(user.tenantId, plan);

    const workerPlans = await this.prisma.gardensWorkerPlan.findMany({
      where: {
        monthId: monthRecord.id,
        ...(dto.workerProfileIds?.length
          ? { workerProfileId: { in: dto.workerProfileIds } }
          : {}),
        ...(dto.onlyPending !== false
          ? {
              status: { in: [GardensPlanStatus.DRAFT, GardensPlanStatus.NEEDS_CHANGES] },
            }
          : {}),
      },
      include: {
        workerProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!workerPlans.length) {
      return { ok: true, sent: 0 };
    }

    await this.prisma.$transaction([
      this.prisma.notification.createMany({
        data: workerPlans.map((workerPlan) => ({
          tenantId: user.tenantId,
          userId: workerPlan.workerProfile.user.id,
          title: 'תזכורת לתוכנית גינון',
          message: `נשמח לעדכון תוכנית העבודה עבור ${plan}.`,
          type: 'GARDENS_PLAN_REMINDER',
          metadata: {
            plan,
            workerPlanId: workerPlan.id,
          },
        })),
      }),
      ...workerPlans.map((workerPlan) =>
        this.prisma.gardensWorkerPlan.update({
          where: { id: workerPlan.id },
          data: { lastReminderAt: new Date() },
        }),
      ),
    ]);

    await this.activity.log({
      userId: user.sub,
      entityType: 'GARDENS_MONTH',
      entityId: monthRecord.id,
      action: 'GARDENS_REMINDERS_SENT',
      summary: `נשלחו ${workerPlans.length} תזכורות עבור ${plan}.`,
      severity: ActivitySeverity.INFO,
      metadata: {
        plan,
        recipients: workerPlans.map((workerPlan) => workerPlan.workerProfile.user.email),
      },
    });

    return {
      ok: true,
      sent: workerPlans.length,
    };
  }

  async getWorkerDashboard(user: AuthUser) {
    this.ensureWorker(user);
    await this.syncWorkerProfiles(user.tenantId);
    const workerProfile = await this.getWorkerProfileByUserId(user.sub);

    if (!workerProfile) {
      throw new NotFoundException('Gardens worker profile not found.');
    }

    const workerPlans = await this.prisma.gardensWorkerPlan.findMany({
      where: {
        workerProfileId: workerProfile.id,
        month: {
          tenantId: user.tenantId,
        },
      },
      include: {
        month: true,
        assignments: {
          orderBy: [{ workDate: 'asc' }],
        },
      },
      orderBy: [{ month: { year: 'asc' } }, { month: { month: 'asc' } }],
    });

    const currentMonthKey = (() => {
      const now = new Date();
      return now.getUTCFullYear() * 100 + (now.getUTCMonth() + 1);
    })();

    const preferred =
      workerPlans.find((planItem) => {
        const planKey = planItem.month.year * 100 + planItem.month.month;
        return planKey >= currentMonthKey;
      }) ?? workerPlans[workerPlans.length - 1];

    const assignments = preferred?.assignments ?? [];

    return {
      worker: {
        workerProfileId: workerProfile.id,
        userId: workerProfile.userId,
        displayName: workerProfile.displayName,
        teamName: workerProfile.teamName,
        email: workerProfile.user.email,
        phone: workerProfile.user.phone,
      },
      month: preferred
        ? {
            id: preferred.month.id,
            plan: this.formatPlanKey(preferred.month.year, preferred.month.month),
            title: preferred.month.title,
            submissionDeadline: preferred.month.submissionDeadline,
            isLocked: preferred.month.isLocked,
            status: preferred.status,
            submittedAt: preferred.submittedAt,
            reviewedAt: preferred.reviewedAt,
            reviewNote: preferred.reviewNote,
          }
        : null,
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        date: assignment.workDate.toISOString().slice(0, 10),
        location: assignment.location,
        notes: assignment.notes ?? '',
      })),
      summary: preferred
        ? {
            assignmentCount: assignments.length,
            filledDays: assignments.length,
          }
        : {
            assignmentCount: 0,
            filledDays: 0,
          },
      months: workerPlans.map((planItem) => ({
        id: planItem.month.id,
        plan: this.formatPlanKey(planItem.month.year, planItem.month.month),
        title: planItem.month.title,
        isLocked: planItem.month.isLocked,
        status: planItem.status,
        assignmentCount: planItem.assignments.length,
        submittedAt: planItem.submittedAt,
      })),
    };
  }

  async getCurrentWorkerMonth(user: AuthUser) {
    const dashboard = await this.getWorkerDashboard(user);
    return {
      month: dashboard.month?.plan ?? null,
      status: dashboard.month?.status ?? null,
    };
  }

  async getWorkerMonth(user: AuthUser, plan: string) {
    this.ensureWorker(user);
    const workerProfile = await this.getWorkerProfileByUserId(user.sub);
    if (!workerProfile) {
      throw new NotFoundException('Gardens worker profile not found.');
    }

    const monthRecord = await this.getMonthOrThrow(user.tenantId, plan);
    const workerPlan = await this.prisma.gardensWorkerPlan.findUnique({
      where: {
        monthId_workerProfileId: {
          monthId: monthRecord.id,
          workerProfileId: workerProfile.id,
        },
      },
      include: {
        month: true,
        assignments: {
          orderBy: [{ workDate: 'asc' }],
        },
      },
    });

    if (!workerPlan) {
      throw new NotFoundException('Worker plan not found for this month.');
    }

    return {
      worker: {
        workerProfileId: workerProfile.id,
        userId: workerProfile.userId,
        displayName: workerProfile.displayName,
        teamName: workerProfile.teamName,
        email: workerProfile.user.email,
        phone: workerProfile.user.phone,
      },
      month: {
        id: workerPlan.month.id,
        plan,
        title: workerPlan.month.title,
        submissionDeadline: workerPlan.month.submissionDeadline,
        isLocked: workerPlan.month.isLocked,
        status: workerPlan.status,
        submittedAt: workerPlan.submittedAt,
        reviewedAt: workerPlan.reviewedAt,
        reviewNote: workerPlan.reviewNote,
      },
      assignments: workerPlan.assignments.map((assignment) => ({
        id: assignment.id,
        date: assignment.workDate.toISOString().slice(0, 10),
        location: assignment.location,
        notes: assignment.notes ?? '',
      })),
      summary: {
        assignmentCount: workerPlan.assignments.length,
        filledDays: workerPlan.assignments.length,
      },
    };
  }

  async saveWorkerAssignments(
    user: AuthUser,
    plan: string,
    assignments: GardensAssignmentInputDto[],
  ) {
    this.ensureWorker(user);
    const workerProfile = await this.getWorkerProfileByUserId(user.sub);
    if (!workerProfile) {
      throw new NotFoundException('Gardens worker profile not found.');
    }

    const monthRecord = await this.getMonthOrThrow(user.tenantId, plan);
    if (monthRecord.isLocked) {
      throw new BadRequestException('This month is locked and cannot be edited.');
    }

    const workerPlan = await this.prisma.gardensWorkerPlan.findUnique({
      where: {
        monthId_workerProfileId: {
          monthId: monthRecord.id,
          workerProfileId: workerProfile.id,
        },
      },
      include: {
        month: true,
      },
    });

    if (!workerPlan) {
      throw new NotFoundException('Worker plan not found for this month.');
    }

    if (workerPlan.status === GardensPlanStatus.APPROVED) {
      throw new BadRequestException('Approved plans cannot be edited.');
    }

    const deduped = new Map<string, { workDate: Date; location: string; notes?: string }>();
    assignments.forEach((assignment) => {
      deduped.set(assignment.date, {
        workDate: this.normalizeDate(assignment.date),
        location: assignment.location.trim(),
        notes: assignment.notes?.trim() || undefined,
      });
    });

    for (const value of deduped.values()) {
      if (!value.location) {
        throw new BadRequestException('Every assignment must include a location.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.gardensAssignment.deleteMany({
        where: {
          workerPlanId: workerPlan.id,
        },
      });

      if (deduped.size > 0) {
        await tx.gardensAssignment.createMany({
          data: Array.from(deduped.values()).map((assignment, index) => ({
            workerPlanId: workerPlan.id,
            workDate: assignment.workDate,
            location: assignment.location,
            notes: assignment.notes,
            sortOrder: index,
          })),
        });
      }

      await tx.gardensWorkerPlan.update({
        where: { id: workerPlan.id },
        data: {
          status:
            workerPlan.status === GardensPlanStatus.NEEDS_CHANGES
              ? GardensPlanStatus.NEEDS_CHANGES
              : GardensPlanStatus.DRAFT,
        },
      });
    });

    await this.activity.log({
      userId: user.sub,
      entityType: 'GARDENS_WORKER_PLAN',
      entityId: workerPlan.id,
      action: 'GARDENS_PLAN_SAVED',
      summary: `תוכנית הגינון ${plan} נשמרה כטיוטה.`,
      severity: ActivitySeverity.INFO,
      metadata: {
        plan,
        assignmentCount: deduped.size,
      },
    });

    return {
      ok: true,
      assignmentCount: deduped.size,
    };
  }

  async submitWorkerPlan(user: AuthUser, plan: string) {
    this.ensureWorker(user);
    const workerProfile = await this.getWorkerProfileByUserId(user.sub);
    if (!workerProfile) {
      throw new NotFoundException('Gardens worker profile not found.');
    }

    const monthRecord = await this.getMonthOrThrow(user.tenantId, plan);
    if (monthRecord.isLocked) {
      throw new BadRequestException('This month is locked and cannot be submitted.');
    }

    const workerPlan = await this.prisma.gardensWorkerPlan.findUnique({
      where: {
        monthId_workerProfileId: {
          monthId: monthRecord.id,
          workerProfileId: workerProfile.id,
        },
      },
      include: {
        assignments: true,
      },
    });

    if (!workerPlan) {
      throw new NotFoundException('Worker plan not found for this month.');
    }

    if (!workerPlan.assignments.length) {
      throw new BadRequestException('Add at least one assignment before submitting the plan.');
    }

    const updated = await this.prisma.gardensWorkerPlan.update({
      where: { id: workerPlan.id },
      data: {
        status: GardensPlanStatus.SUBMITTED,
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedById: null,
        reviewNote: null,
      },
    });

    await this.notifyManagersAboutSubmission(
      user.tenantId,
      workerProfile.displayName,
      plan,
      updated.id,
    );

    await this.activity.log({
      userId: user.sub,
      entityType: 'GARDENS_WORKER_PLAN',
      entityId: updated.id,
      action: 'GARDENS_PLAN_SUBMITTED',
      summary: `תוכנית הגינון ${plan} הוגשה לאישור.`,
      severity: ActivitySeverity.INFO,
      metadata: {
        plan,
        workerProfileId: workerProfile.id,
        assignmentCount: workerPlan.assignments.length,
      },
    });

    return {
      ok: true,
      status: updated.status,
      submittedAt: updated.submittedAt,
    };
  }
}
