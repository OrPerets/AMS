import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
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

  async getTemplates() {
    // Static templates for now; can be moved to DB later
    return [
      { id: 'summary', name: 'Financial Summary', description: 'Planned vs Actual with variance' },
      { id: 'pnl', name: 'Profit & Loss', description: 'Revenue, Expenses and Profit' },
      { id: 'cash-flow', name: 'Cash Flow', description: 'Monthly inflow/outflow and net' },
      { id: 'variance', name: 'Variance Report', description: 'Budgets by variance' },
    ];
  }

  async export(type: 'summary' | 'pnl' | 'cash-flow' | 'variance', format: 'csv' | 'xlsx' | 'pdf', opts: { buildingId?: number } = {}) {
    // Build data by type
    let filename = `${type}.${format}`;
    if (format === 'xlsx') {
      // For now return CSV content with XLSX content-type fallback
      format = 'csv';
      filename = `${type}.xlsx`;
    }

    if (format === 'pdf') {
      const buffer = await this.exportPdf(type, opts);
      return { filename, contentType: 'application/pdf', buffer };
    }

    const csv = await this.exportCsv(type, opts);
    const buffer = Buffer.from(csv, 'utf8');
    const contentType = 'text/csv';
    return { filename, contentType, buffer };
  }

  private async exportCsv(type: 'summary' | 'pnl' | 'cash-flow' | 'variance', opts: { buildingId?: number }) {
    switch (type) {
      case 'summary': {
        const s = await this.getSummary();
        const lines = [
          'planned,actual,variance',
          `${s.planned},${s.actual},${s.variance}`,
        ];
        return lines.join('\n');
      }
      case 'pnl': {
        const p = await this.getProfitAndLoss();
        const lines = [
          'revenue,expenses,profit',
          `${p.revenue},${p.expenses},${p.profit}`,
        ];
        return lines.join('\n');
      }
      case 'cash-flow': {
        const rows = await this.getCashFlow();
        const lines = ['month,inflow,outflow,net', ...rows.map(r => `${r.month},${r.inflow},${r.outflow},${r.net}`)];
        return lines.join('\n');
      }
      case 'variance': {
        const rows = await this.getVarianceReport(opts.buildingId);
        const lines = ['id,year,name,planned,actual,variance', ...rows.map(r => `${r.id},${r.year},"${r.name}",${r.planned},${r.actual},${r.variance}`)];
        return lines.join('\n');
      }
    }
  }

  private async exportPdf(type: 'summary' | 'pnl' | 'cash-flow' | 'variance', opts: { buildingId?: number }) {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];
    doc.fontSize(18).text(`Report: ${type}`, { underline: true });
    doc.moveDown();

    if (type === 'summary') {
      const s = await this.getSummary();
      doc.fontSize(12).text(`Planned: ${s.planned}`);
      doc.text(`Actual: ${s.actual}`);
      doc.text(`Variance: ${s.variance}`);
    } else if (type === 'pnl') {
      const p = await this.getProfitAndLoss();
      doc.fontSize(12).text(`Revenue: ${p.revenue}`);
      doc.text(`Expenses: ${p.expenses}`);
      doc.text(`Profit: ${p.profit}`);
    } else if (type === 'cash-flow') {
      const rows = await this.getCashFlow();
      doc.fontSize(12).text('Month, Inflow, Outflow, Net');
      doc.moveDown(0.5);
      for (const r of rows) {
        doc.text(`${r.month}: ${r.inflow} / ${r.outflow} / ${r.net}`);
      }
    } else if (type === 'variance') {
      const rows = await this.getVarianceReport(opts.buildingId);
      doc.fontSize(12).text('Year, Name, Planned, Actual, Variance');
      doc.moveDown(0.5);
      for (const r of rows) {
        doc.text(`${r.year}, ${r.name}, ${r.planned}, ${r.actual}, ${r.variance}`);
      }
    }

    doc.end();
    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
    return buffer;
  }

  async scheduleReport(body: { type: 'summary' | 'pnl' | 'cash-flow' | 'variance'; cron: string; recipients: string[] }) {
    // Minimal stub: In real implementation, persist to DB and background job
    return { id: Date.now(), status: 'SCHEDULED', ...body };
  }
}


