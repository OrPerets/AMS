import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { Prisma, ExpenseStatus, BudgetStatus, ApprovalTaskType, Role } from '@prisma/client';
import { NotificationService, NotificationTemplate } from '../notifications/notification.service';
import { ApprovalService } from '../approval/approval.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class BudgetService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private approvals: ApprovalService,
    private activity: ActivityService,
  ) {}

  private mapBudgetCreate(dto: CreateBudgetDto): Prisma.BudgetCreateInput {
    const { buildingId, ...rest } = dto;
    return {
      ...rest,
      building: { connect: { id: buildingId } },
    };
  }

  private mapBudgetUpdate(dto: UpdateBudgetDto): Prisma.BudgetUpdateInput {
    const { buildingId, ...rest } = dto;
    return {
      ...rest,
      building: buildingId ? { connect: { id: buildingId } } : undefined,
    };
  }

  async create(dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: this.mapBudgetCreate(dto),
      include: { expenses: true },
    });
  }

  findAll() {
    return this.prisma.budget.findMany({
      include: { expenses: true, building: true },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findOne(id: number) {
    return this.prisma.budget.findUnique({
      where: { id },
      include: { expenses: true, building: true },
    });
  }

  update(id: number, dto: UpdateBudgetDto) {
    return this.prisma.budget.update({
      where: { id },
      data: this.mapBudgetUpdate(dto),
      include: { expenses: true },
    });
  }

  async remove(id: number) {
    await this.prisma.expense.updateMany({ where: { budgetId: id }, data: { budgetId: null } });
    return this.prisma.budget.delete({ where: { id } });
  }

  async addExpense(dto: CreateExpenseDto, userId?: number) {
    const { buildingId, budgetId, incurredAt, ...rest } = dto;
    const expense = await this.prisma.expense.create({
      data: {
        ...rest,
        incurredAt: incurredAt ? new Date(incurredAt) : new Date(),
        building: { connect: { id: buildingId } },
        budget: budgetId ? { connect: { id: budgetId } } : undefined,
      },
      include: { building: true, budget: true, documents: true },
    });

    const budgetOverrun =
      expense.budget && expense.budget.amount > 0 ? expense.budget.actualSpent + expense.amount > expense.budget.amount : false;

    await this.approvals.createTask({
      type: ApprovalTaskType.EXPENSE_APPROVAL,
      entityType: 'EXPENSE',
      entityId: expense.id,
      buildingId: expense.buildingId,
      requestedById: userId,
      title: `אישור הוצאה #${expense.id}`,
      description: expense.description ?? `הוצאה בסך ₪${expense.amount.toLocaleString()}`,
      metadata: { amount: expense.amount, category: expense.category, budgetId: expense.budgetId ?? null },
    });

    if (budgetOverrun) {
      await this.approvals.createTask({
        type: ApprovalTaskType.BUDGET_OVERRUN,
        entityType: 'EXPENSE',
        entityId: expense.id,
        buildingId: expense.buildingId,
        requestedById: userId,
        title: `חריגת תקציב עבור הוצאה #${expense.id}`,
        description: `ההוצאה תחרוג מהתקציב ${expense.budget?.name ?? ''}`.trim(),
        metadata: {
          amount: expense.amount,
          budgetId: expense.budgetId ?? null,
          planned: expense.budget?.amount ?? null,
          actualSpent: expense.budget?.actualSpent ?? null,
        },
      });
    }

    await this.activity.log({
      userId,
      buildingId: expense.buildingId,
      entityType: 'EXPENSE',
      entityId: expense.id,
      action: 'EXPENSE_SUBMITTED',
      summary: `הוצאה #${expense.id} נשלחה לאישור.`,
      metadata: { amount: expense.amount, category: expense.category, budgetOverrun },
    });

    return expense;
  }

  async getSummaryForBuilding(buildingId: number) {
    const budgets = await this.prisma.budget.findMany({
      where: { buildingId },
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
      where: { buildingId },
    });

    return {
      budgets: budgets.map((budget) => {
        const utilization = budget.amount > 0 ? (budget.actualSpent / budget.amount) * 100 : 0;
        return {
          ...budget,
          variance: budget.amount - budget.actualSpent,
          utilization,
          alertLevel: utilization >= 100 ? 'critical' : utilization >= 80 ? 'warning' : 'normal',
        };
      }),
      totals: {
        planned: totals.planned,
        actual: totals.actual,
        variance: totals.planned - totals.actual,
      },
      expensesByCategory,
    };
  }

  async approve(id: number) {
    const budget = await this.prisma.budget.update({
      where: { id },
      data: { status: BudgetStatus.ACTIVE },
    });
    // Notify building users
    try {
      await this.notifications.notifyBuilding(budget.buildingId, NotificationTemplate.ANNOUNCEMENT, {
        title: 'אישור תקציב',
        message: `התקציב "${budget.name}" לשנת ${budget.year} אושר והופעל.`,
      });
    } catch (e) {
      console.warn('Budget approval notification failed', e);
    }
    return budget;
  }

  async reject(id: number) {
    const budget = await this.prisma.budget.update({
      where: { id },
      data: { status: BudgetStatus.PLANNED },
    });
    try {
      await this.notifications.notifyBuilding(budget.buildingId, NotificationTemplate.ANNOUNCEMENT, {
        title: 'דחיית תקציב',
        message: `התקציב "${budget.name}" לשנת ${budget.year} נדחה ונותר בתכנון.`,
      });
    } catch (e) {
      console.warn('Budget rejection notification failed', e);
    }
    return budget;
  }

  private async updateBudgetActualsAndAlert(budgetId: number) {
    const aggregate = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: { budgetId, status: ExpenseStatus.APPROVED },
    });
    const updated = await this.prisma.budget.update({
      where: { id: budgetId },
      data: { actualSpent: aggregate._sum.amount ?? 0 },
    });
    try {
      if (updated.amount > 0) {
        const utilization = (updated.actualSpent / updated.amount) * 100;
        if (utilization >= 100) {
          await this.notifications.notifyBuilding(updated.buildingId, NotificationTemplate.ANNOUNCEMENT, {
            title: 'חריגת תקציב',
            message: `התקציב "${updated.name}" לשנת ${updated.year} חרג ב-₪${(updated.actualSpent - updated.amount).toLocaleString()}`,
          });
        } else if (utilization >= 80) {
          await this.notifications.notifyBuilding(updated.buildingId, NotificationTemplate.ANNOUNCEMENT, {
            title: 'התראה על ניצול תקציב',
            message: `התקציב "${updated.name}" לשנת ${updated.year} הגיע ל-${utilization.toFixed(0)}% ניצול.`,
          });
        }
      }
    } catch (e) {
      console.warn('Budget alert notification failed', e);
    }
    return updated;
  }

  async approveExpense(expenseId: number, approverUserId?: number, approverRole?: Role, comment?: string) {
    const approval = await this.prisma.approvalTask.findFirst({
      where: {
        entityType: 'EXPENSE',
        entityId: expenseId,
        type: ApprovalTaskType.EXPENSE_APPROVAL,
        status: 'PENDING',
      },
    });

    if (approval && approverUserId && approverRole) {
      await this.approvals.approve(approval.id, approverUserId, approverRole, comment);
    } else {
      const expense = await this.prisma.expense.update({
        where: { id: expenseId },
        data: { status: ExpenseStatus.APPROVED, approvedById: approverUserId, approvedAt: new Date() },
        include: { budget: true },
      });
      if (expense.budgetId) {
        await this.updateBudgetActualsAndAlert(expense.budgetId);
      }
    }

    return this.prisma.expense.findUniqueOrThrow({
      where: { id: expenseId },
      include: { building: true, budget: true },
    });
  }

  async rejectExpense(expenseId: number, approverUserId?: number, approverRole?: Role, comment?: string) {
    const approval = await this.prisma.approvalTask.findFirst({
      where: {
        entityType: 'EXPENSE',
        entityId: expenseId,
        type: ApprovalTaskType.EXPENSE_APPROVAL,
        status: 'PENDING',
      },
    });

    if (approval && approverUserId && approverRole) {
      await this.approvals.reject(approval.id, approverUserId, approverRole, comment);
    } else {
      await this.prisma.expense.update({
        where: { id: expenseId },
        data: { status: ExpenseStatus.REJECTED, approvedById: approverUserId, approvedAt: new Date() },
      });
    }

    return this.prisma.expense.findUniqueOrThrow({
      where: { id: expenseId },
      include: { building: true, budget: true },
    });
  }

  listExpenses(status?: ExpenseStatus) {
    return this.prisma.expense.findMany({
      where: status ? { status } : {},
      orderBy: [{ incurredAt: 'desc' }],
      include: { building: true, budget: true },
    });
  }
}
