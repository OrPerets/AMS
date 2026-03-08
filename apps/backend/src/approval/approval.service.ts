import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ActivitySeverity,
  ApprovalTaskStatus,
  ApprovalTaskType,
  ExpenseStatus,
  Prisma,
  Role,
  TicketStatus,
  WorkOrderStatus,
} from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';

type CreateApprovalTaskInput = {
  type: ApprovalTaskType;
  entityType: string;
  entityId?: number | null;
  buildingId?: number | null;
  residentId?: number | null;
  requestedById?: number | null;
  title: string;
  description?: string | null;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

  private approverRolesByType(type: ApprovalTaskType): Role[] {
    switch (type) {
      case ApprovalTaskType.EXPENSE_APPROVAL:
      case ApprovalTaskType.BUDGET_OVERRUN:
      case ApprovalTaskType.RESIDENT_BALANCE_ADJUSTMENT:
        return [Role.ADMIN, Role.ACCOUNTANT];
      case ApprovalTaskType.WORK_ORDER_APPROVAL:
        return [Role.ADMIN, Role.PM];
      case ApprovalTaskType.DOCUMENT_DELETE:
        return [Role.ADMIN];
      default:
        return [Role.ADMIN];
    }
  }

  private async notifyApprovers(task: { id: number; type: ApprovalTaskType; title: string; buildingId?: number | null }) {
    const roles = this.approverRolesByType(task.type);
    const approvers = await this.prisma.user.findMany({
      where: { role: { in: roles } },
      select: { id: true, tenantId: true },
    });

    if (!approvers.length) return;

    await this.prisma.notification.createMany({
      data: approvers.map((user) => ({
        tenantId: user.tenantId,
        userId: user.id,
        buildingId: task.buildingId ?? null,
        title: 'בקשת אישור חדשה',
        message: `${task.title} ממתינה לאישור.`,
        type: 'APPROVAL_REQUESTED',
        metadata: { approvalTaskId: task.id, approvalType: task.type },
      })),
    });
  }

  private async notifyRequester(task: { id: number; requestedById?: number | null; buildingId?: number | null; title: string }, status: ApprovalTaskStatus) {
    if (!task.requestedById) return;

    const requester = await this.prisma.user.findUnique({
      where: { id: task.requestedById },
      select: { id: true, tenantId: true },
    });
    if (!requester) return;

    await this.prisma.notification.create({
      data: {
        tenantId: requester.tenantId,
        userId: requester.id,
        buildingId: task.buildingId ?? null,
        title: status === ApprovalTaskStatus.APPROVED ? 'בקשת האישור אושרה' : 'בקשת האישור נדחתה',
        message: `${task.title} ${status === ApprovalTaskStatus.APPROVED ? 'אושרה' : 'נדחתה'}.`,
        type: status === ApprovalTaskStatus.APPROVED ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
        metadata: { approvalTaskId: task.id },
      },
    });
  }

  async createTask(input: CreateApprovalTaskInput) {
    const existing = input.entityId
      ? await this.prisma.approvalTask.findFirst({
          where: {
            type: input.type,
            entityType: input.entityType,
            entityId: input.entityId,
            status: ApprovalTaskStatus.PENDING,
          },
        })
      : null;

    if (existing) {
      return existing;
    }

    const task = await this.prisma.approvalTask.create({
      data: {
        type: input.type,
        entityType: input.entityType,
        entityId: input.entityId ?? undefined,
        buildingId: input.buildingId ?? undefined,
        residentId: input.residentId ?? undefined,
        requestedById: input.requestedById ?? undefined,
        title: input.title,
        description: input.description ?? undefined,
        reason: input.reason ?? undefined,
        metadata: input.metadata,
      },
      include: {
        building: true,
        resident: { include: { user: true } },
        requestedBy: { select: { id: true, email: true, role: true } },
        decidedBy: { select: { id: true, email: true, role: true } },
      },
    });

    await this.activity.log({
      userId: input.requestedById ?? undefined,
      buildingId: input.buildingId ?? undefined,
      residentId: input.residentId ?? undefined,
      entityType: 'APPROVAL_TASK',
      entityId: task.id,
      action: 'APPROVAL_REQUESTED',
      summary: `${task.title} נשלחה לאישור.`,
      severity: ActivitySeverity.WARNING,
      metadata: { approvalType: task.type, entityType: task.entityType, entityId: task.entityId ?? null },
    });

    await this.notifyApprovers(task);
    return task;
  }

  async list(input: { status?: ApprovalTaskStatus; type?: ApprovalTaskType; buildingId?: number }) {
    const rows = await this.prisma.approvalTask.findMany({
      where: {
        status: input.status,
        type: input.type,
        buildingId: input.buildingId,
      },
      include: {
        building: true,
        resident: { include: { user: true } },
        requestedBy: { select: { id: true, email: true, role: true } },
        decidedBy: { select: { id: true, email: true, role: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => ({
      ...row,
      requesterEmail: row.requestedBy?.email ?? null,
      decisionEmail: row.decidedBy?.email ?? null,
      residentEmail: row.resident?.user?.email ?? null,
      buildingName: row.building?.name ?? null,
    }));
  }

  private async syncBudgetActuals(budgetId: number) {
    const aggregate = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: { budgetId, status: ExpenseStatus.APPROVED },
    });
    await this.prisma.budget.update({
      where: { id: budgetId },
      data: { actualSpent: aggregate._sum.amount ?? 0 },
    });
  }

  private async applyApprovalEffects(task: {
    id: number;
    type: ApprovalTaskType;
    entityId: number | null;
    buildingId: number | null;
    residentId: number | null;
    metadata: Prisma.JsonValue | null;
  }, decidedById: number) {
    switch (task.type) {
      case ApprovalTaskType.EXPENSE_APPROVAL: {
        if (!task.entityId) throw new BadRequestException('Expense approval task is missing entityId.');
        const expense = await this.prisma.expense.update({
          where: { id: task.entityId },
          data: {
            status: ExpenseStatus.APPROVED,
            approvedById: decidedById,
            approvedAt: new Date(),
          },
        });
        if (expense.budgetId) {
          await this.syncBudgetActuals(expense.budgetId);
        }
        break;
      }
      case ApprovalTaskType.BUDGET_OVERRUN: {
        break;
      }
      case ApprovalTaskType.WORK_ORDER_APPROVAL: {
        if (!task.entityId) throw new BadRequestException('Work-order approval task is missing entityId.');
        const order = await this.prisma.workOrder.findUnique({ where: { id: task.entityId } });
        if (!order) throw new NotFoundException('Work order not found.');
        await this.prisma.$transaction([
          this.prisma.workOrder.update({
            where: { id: task.entityId },
            data: {
              status: WorkOrderStatus.APPROVED,
              approvedById: decidedById,
              approvedAt: new Date(),
            },
          }),
          this.prisma.ticket.update({
            where: { id: order.ticketId },
            data: { status: TicketStatus.ASSIGNED },
          }),
        ]);
        break;
      }
      case ApprovalTaskType.DOCUMENT_DELETE: {
        if (!task.entityId) throw new BadRequestException('Document delete task is missing entityId.');
        await this.prisma.document.delete({ where: { id: task.entityId } });
        break;
      }
      case ApprovalTaskType.RESIDENT_BALANCE_ADJUSTMENT: {
        if (!task.entityId) throw new BadRequestException('Adjustment task is missing invoice entityId.');
        const metadata = (task.metadata ?? {}) as Record<string, any>;
        const amount = Number(metadata.amount ?? 0);
        if (!amount) {
          throw new BadRequestException('Adjustment task is missing amount metadata.');
        }
        await this.prisma.invoice.update({
          where: { id: task.entityId },
          data: {
            amount: { increment: amount } as any,
          },
        });
        await this.prisma.ledgerEntry.create({
          data: {
            invoiceId: task.entityId,
            entryType: 'adjustment',
            amount,
            debit: amount >= 0 ? 'Accounts Receivable' : 'Adjustment Expense',
            credit: amount >= 0 ? 'Adjustment Revenue' : 'Accounts Receivable',
          },
        });
        break;
      }
      default:
        break;
    }
  }

  private async applyRejectionEffects(task: { type: ApprovalTaskType; entityId: number | null }) {
    switch (task.type) {
      case ApprovalTaskType.EXPENSE_APPROVAL:
      case ApprovalTaskType.BUDGET_OVERRUN:
        if (task.entityId) {
          await this.prisma.expense.update({
            where: { id: task.entityId },
            data: { status: ExpenseStatus.REJECTED },
          });
        }
        break;
      default:
        break;
    }
  }

  private assertDecisionRole(type: ApprovalTaskType, actorRole: Role) {
    const allowedRoles = this.approverRolesByType(type);
    if (!allowedRoles.includes(actorRole) && actorRole !== Role.MASTER) {
      throw new BadRequestException('User role is not allowed to decide this approval task.');
    }
  }

  async approve(taskId: number, decidedById: number, actorRole: Role, comment?: string) {
    const task = await this.prisma.approvalTask.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Approval task not found.');
    }
    if (task.status !== ApprovalTaskStatus.PENDING) {
      throw new BadRequestException('Approval task has already been resolved.');
    }
    this.assertDecisionRole(task.type, actorRole);

    await this.applyApprovalEffects(task, decidedById);

    const updated = await this.prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        status: ApprovalTaskStatus.APPROVED,
        decidedById,
        decidedAt: new Date(),
        metadata: {
          ...(task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata) ? (task.metadata as Record<string, unknown>) : {}),
          decisionComment: comment ?? null,
        },
      },
      include: {
        building: true,
        resident: { include: { user: true } },
        requestedBy: { select: { id: true, email: true, role: true } },
        decidedBy: { select: { id: true, email: true, role: true } },
      },
    });

    await this.activity.log({
      userId: decidedById,
      buildingId: updated.buildingId ?? undefined,
      residentId: updated.residentId ?? undefined,
      entityType: 'APPROVAL_TASK',
      entityId: updated.id,
      action: 'APPROVAL_APPROVED',
      summary: `${updated.title} אושרה.`,
      metadata: { approvalType: updated.type, entityType: updated.entityType, entityId: updated.entityId ?? null },
    });

    await this.notifyRequester(updated, ApprovalTaskStatus.APPROVED);
    return updated;
  }

  async reject(taskId: number, decidedById: number, actorRole: Role, comment?: string) {
    const task = await this.prisma.approvalTask.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Approval task not found.');
    }
    if (task.status !== ApprovalTaskStatus.PENDING) {
      throw new BadRequestException('Approval task has already been resolved.');
    }
    this.assertDecisionRole(task.type, actorRole);

    await this.applyRejectionEffects(task);

    const updated = await this.prisma.approvalTask.update({
      where: { id: taskId },
      data: {
        status: ApprovalTaskStatus.REJECTED,
        decidedById,
        decidedAt: new Date(),
        metadata: {
          ...(task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata) ? (task.metadata as Record<string, unknown>) : {}),
          decisionComment: comment ?? null,
        },
      },
      include: {
        building: true,
        resident: { include: { user: true } },
        requestedBy: { select: { id: true, email: true, role: true } },
        decidedBy: { select: { id: true, email: true, role: true } },
      },
    });

    await this.activity.log({
      userId: decidedById,
      buildingId: updated.buildingId ?? undefined,
      residentId: updated.residentId ?? undefined,
      entityType: 'APPROVAL_TASK',
      entityId: updated.id,
      action: 'APPROVAL_REJECTED',
      summary: `${updated.title} נדחתה.`,
      severity: ActivitySeverity.WARNING,
      metadata: { approvalType: updated.type, entityType: updated.entityType, entityId: updated.entityId ?? null },
    });

    await this.notifyRequester(updated, ApprovalTaskStatus.REJECTED);
    return updated;
  }
}
