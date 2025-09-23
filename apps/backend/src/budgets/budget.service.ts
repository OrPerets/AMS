import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { Prisma } from '@prisma/client';
import { NotificationService, NotificationTemplate } from '../notifications/notification.service';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService, private notifications: NotificationService) {}

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

  async addExpense(dto: CreateExpenseDto) {
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
    // Do not update budget actuals until approved
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
      budgets,
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
      data: { status: 'ACTIVE' as any },
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
      data: { status: 'PLANNED' as any },
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
      where: { budgetId, status: 'APPROVED' as any },
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

  async approveExpense(expenseId: number, approverUserId?: number) {
    const expense = await this.prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'APPROVED' as any, approvedById: approverUserId, approvedAt: new Date() },
      include: { budget: true },
    });
    if (expense.budgetId) {
      await this.updateBudgetActualsAndAlert(expense.budgetId);
    }
    return expense;
  }

  async rejectExpense(expenseId: number, approverUserId?: number) {
    const expense = await this.prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'REJECTED' as any, approvedById: approverUserId, approvedAt: new Date() },
    });
    return expense;
  }

  listExpenses(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.expense.findMany({
      where: status ? { status: status as any } : {},
      orderBy: [{ incurredAt: 'desc' }],
      include: { building: true, budget: true },
    });
  }
}
