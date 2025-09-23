import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

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

    if (budgetId) {
      const aggregate = await this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { budgetId },
      });
      await this.prisma.budget.update({
        where: { id: budgetId },
        data: { actualSpent: aggregate._sum.amount ?? 0 },
      });
    }

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
}
