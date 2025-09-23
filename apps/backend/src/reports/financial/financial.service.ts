import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async getSummary(tenantId?: number) {
    const [budgets, expenses] = await Promise.all([
      this.prisma.budget.aggregate({ _sum: { amount: true, actualSpent: true } }),
      this.prisma.expense.groupBy({ by: ['category'], _sum: { amount: true } }),
    ]);
    const planned = budgets._sum.amount ?? 0;
    const actual = budgets._sum.actualSpent ?? 0;
    return {
      planned,
      actual,
      variance: planned - actual,
      expensesByCategory: expenses,
    };
  }

  async getProfitAndLoss() {
    // Revenue: sum of PAID invoices; Expenses: sum of all expenses
    const [revenueAgg, expenseAgg] = await Promise.all([
      this.prisma.invoice.aggregate({ _sum: { amount: true } }),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);
    const revenue = revenueAgg._sum.amount ?? 0;
    const expenses = expenseAgg._sum.amount ?? 0;
    return { revenue, expenses, profit: revenue - expenses };
  }

  async getCashFlow() {
    // Simplified: invoices as inflow, expenses as outflow grouped by month
    const invoices = await this.prisma.invoice.findMany({ select: { amount: true, createdAt: true } });
    const expenses = await this.prisma.expense.findMany({ select: { amount: true, incurredAt: true } });
    const bucket = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const map: Record<string, { inflow: number; outflow: number; net: number }> = {};
    for (const inv of invoices) {
      const k = bucket(new Date(inv.createdAt));
      map[k] = map[k] || { inflow: 0, outflow: 0, net: 0 };
      map[k].inflow += inv.amount;
    }
    for (const ex of expenses) {
      const k = bucket(new Date(ex.incurredAt));
      map[k] = map[k] || { inflow: 0, outflow: 0, net: 0 };
      map[k].outflow += ex.amount;
    }
    for (const k of Object.keys(map)) map[k].net = map[k].inflow - map[k].outflow;
    const months = Object.keys(map).sort();
    return months.map((m) => ({ month: m, ...map[m] }));
  }

  async getVarianceReport(buildingId?: number) {
    const budgets = await this.prisma.budget.findMany({
      where: buildingId ? { buildingId } : undefined,
      include: { expenses: true },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });
    return budgets.map((b) => ({
      id: b.id,
      name: b.name,
      year: b.year,
      planned: b.amount,
      actual: b.actualSpent,
      variance: b.amount - b.actualSpent,
    }));
  }

  async getForecast() {
    // Naive forecast: average last 3 months expenses and revenue
    const invoices = await this.prisma.invoice.findMany({ select: { amount: true, createdAt: true } });
    const expenses = await this.prisma.expense.findMany({ select: { amount: true, incurredAt: true } });
    const byMonth = (items: { amount: number; date: Date }[]) => {
      const map: Record<string, number> = {};
      for (const it of items) {
        const k = `${it.date.getFullYear()}-${String(it.date.getMonth() + 1).padStart(2, '0')}`;
        map[k] = (map[k] || 0) + it.amount;
      }
      const months = Object.keys(map).sort().slice(-3);
      const avg = months.length ? months.reduce((s, m) => s + map[m], 0) / months.length : 0;
      return avg;
    };
    const avgRevenue = byMonth(invoices.map((i) => ({ amount: i.amount, date: new Date(i.createdAt) })));
    const avgExpense = byMonth(expenses.map((e) => ({ amount: e.amount, date: new Date(e.incurredAt) })));
    return { forecastedMonthlyRevenue: avgRevenue, forecastedMonthlyExpense: avgExpense, forecastedMonthlyProfit: avgRevenue - avgExpense };
  }
}


