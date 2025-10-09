import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../../prisma.service';
import { MonthlyReportDto, YearlyReportDto, ExpenseCategory, ExpenseItem, IncomeSource, IncomeItem, ComparisonReportDto } from './dto/monthly-report.dto';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyReport(year: number, month: number, buildingId?: number): Promise<MonthlyReportDto> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get building name if specified
    let buildingName: string | undefined;
    if (buildingId) {
      const building = await this.prisma.building.findUnique({
        where: { id: buildingId },
        select: { name: true },
      });
      buildingName = building?.name;
    }

    // Collect expenses from multiple sources
    const [expenses, workOrders, maintenanceRecords] = await Promise.all([
      // Direct expenses
      this.prisma.expense.findMany({
        where: {
          buildingId: buildingId,
          incurredAt: { gte: startDate, lte: endDate },
        },
        include: { building: true },
      }),
      // Work orders (completed with costs)
      this.prisma.workOrder.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate, lte: endDate },
          ticket: buildingId ? { unit: { buildingId } } : undefined,
        },
        include: {
          ticket: { include: { unit: { include: { building: true } } } },
          supplier: true,
        },
      }),
      // Maintenance costs
      this.prisma.maintenanceSchedule.findMany({
        where: {
          buildingId: buildingId,
          lastCompleted: { gte: startDate, lte: endDate },
        },
        include: { building: true },
      }),
    ]);

    // Collect income from invoices and payments
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: 'PAID',
        createdAt: { gte: startDate, lte: endDate },
        resident: buildingId
          ? { units: { some: { buildingId } } }
          : undefined,
      },
      include: {
        resident: { include: { user: true, units: { include: { building: true } } } },
      },
    });

    // Categorize expenses
    const expenseCategories = new Map<string, ExpenseItem[]>();
    
    // Add direct expenses
    for (const exp of expenses) {
      const category = exp.category || 'OTHER';
      if (!expenseCategories.has(category)) {
        expenseCategories.set(category, []);
      }
      expenseCategories.get(category)!.push({
        date: exp.incurredAt,
        description: exp.description || 'Expense',
        amount: exp.amount,
        referenceType: 'EXPENSE',
        referenceId: exp.id,
      });
    }

    // Add work order costs
    for (const wo of workOrders) {
      const category = 'MAINTENANCE';
      if (!expenseCategories.has(category)) {
        expenseCategories.set(category, []);
      }
      expenseCategories.get(category)!.push({
        date: wo.completedAt!,
        description: `Work Order #${wo.id}`,
        amount: wo.totalCost || 0,
        vendor: wo.supplier?.name,
        referenceType: 'WORK_ORDER',
        referenceId: wo.id,
      });
    }

    // Add maintenance costs
    for (const maint of maintenanceRecords) {
      const category = maint.category || 'GENERAL';
      if (!expenseCategories.has(category)) {
        expenseCategories.set(category, []);
      }
      if (maint.estimatedCost && maint.estimatedCost > 0) {
        expenseCategories.get(category)!.push({
          date: maint.lastCompleted!,
          description: maint.title,
          amount: maint.estimatedCost,
          referenceType: 'MAINTENANCE',
          referenceId: maint.id,
        });
      }
    }

    // Build expense category objects
    const expenseCategoriesArray: ExpenseCategory[] = Array.from(expenseCategories.entries()).map(
      ([category, items]) => ({
        category,
        items,
        total: items.reduce((sum, item) => sum + item.amount, 0),
      })
    );

    // Categorize income
    const incomeSources = new Map<string, IncomeItem[]>();
    
    for (const invoice of invoices) {
      const source = 'RENT_AND_FEES';
      if (!incomeSources.has(source)) {
        incomeSources.set(source, []);
      }
      const tenantName = invoice.resident?.user?.email || 'Unknown';
      incomeSources.get(source)!.push({
        date: invoice.createdAt,
        description: `Invoice #${invoice.id}`,
        amount: invoice.amount,
        tenant: tenantName,
        invoiceId: invoice.id,
      });
    }

    // Build income source objects
    const incomeSourcesArray: IncomeSource[] = Array.from(incomeSources.entries()).map(
      ([source, items]) => ({
        source,
        items,
        total: items.reduce((sum, item) => sum + item.amount, 0),
      })
    );

    // Calculate totals
    const totalExpenses = expenseCategoriesArray.reduce((sum, cat) => sum + cat.total, 0);
    const totalIncome = incomeSourcesArray.reduce((sum, src) => sum + src.total, 0);
    const balance = totalIncome - totalExpenses;

    return {
      month: new Date(year, month - 1).toLocaleString('he-IL', { month: 'long' }),
      year,
      expenses: expenseCategoriesArray,
      income: incomeSourcesArray,
      totalExpenses,
      totalIncome,
      balance,
      buildingId,
      buildingName,
    };
  }

  async getYearlyReport(year: number, buildingId?: number): Promise<YearlyReportDto> {
    const months: MonthlyReportDto[] = [];
    
    // Generate reports for all 12 months
    for (let month = 1; month <= 12; month++) {
      const monthlyReport = await this.getMonthlyReport(year, month, buildingId);
      months.push(monthlyReport);
    }

    const totalIncome = months.reduce((sum, m) => sum + m.totalIncome, 0);
    const totalExpenses = months.reduce((sum, m) => sum + m.totalExpenses, 0);
    const totalBalance = totalIncome - totalExpenses;

    let buildingName: string | undefined;
    if (buildingId) {
      const building = await this.prisma.building.findUnique({
        where: { id: buildingId },
        select: { name: true },
      });
      buildingName = building?.name;
    }

    return {
      year,
      months,
      totalIncome,
      totalExpenses,
      totalBalance,
      buildingId,
      buildingName,
    };
  }

  async getComparisonReport(
    year1: number,
    month1: number | undefined,
    year2: number,
    month2: number | undefined,
    buildingId?: number
  ): Promise<ComparisonReportDto> {
    const period1 = month1
      ? await this.getMonthlyReport(year1, month1, buildingId)
      : await this.getYearlyReport(year1, buildingId);
    
    const period2 = month2
      ? await this.getMonthlyReport(year2, month2, buildingId)
      : await this.getYearlyReport(year2, buildingId);

    const incomeDiff = period2.totalIncome - period1.totalIncome;
    const expensesDiff = period2.totalExpenses - period1.totalExpenses;
    const balance1 = 'balance' in period1 ? period1.balance : period1.totalBalance;
    const balance2 = 'balance' in period2 ? period2.balance : period2.totalBalance;
    const balanceDiff = balance2 - balance1;
    
    const incomePercentChange = period1.totalIncome !== 0 
      ? (incomeDiff / period1.totalIncome) * 100 
      : 0;
    const expensesPercentChange = period1.totalExpenses !== 0 
      ? (expensesDiff / period1.totalExpenses) * 100 
      : 0;

    return {
      period1,
      period2,
      differences: {
        incomeDiff,
        expensesDiff,
        balanceDiff,
        incomePercentChange,
        expensesPercentChange,
      },
    };
  }

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

  async export(type: 'summary' | 'pnl' | 'cash-flow' | 'variance' | 'monthly', format: 'csv' | 'xlsx' | 'pdf', opts: { buildingId?: number; year?: number; month?: number } = {}) {
    // Build data by type
    const filename = `${type}.${format}`;

    if (format === 'xlsx') {
      const buffer = await this.exportExcel(type, opts);
      return { filename, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer };
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

  private async exportExcel(type: 'summary' | 'pnl' | 'cash-flow' | 'variance' | 'monthly', opts: { buildingId?: number; year?: number; month?: number }) {
    // Using a simple approach without external library for now
    // In production, you'd want to use exceljs
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    worksheet.columns = [
      { header: 'Field', key: 'field', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    switch (type) {
      case 'summary': {
        const s = await this.getSummary();
        worksheet.addRow({ field: 'Planned', value: s.planned });
        worksheet.addRow({ field: 'Actual', value: s.actual });
        worksheet.addRow({ field: 'Variance', value: s.variance });
        break;
      }
      case 'pnl': {
        const p = await this.getProfitAndLoss();
        worksheet.addRow({ field: 'Revenue', value: p.revenue });
        worksheet.addRow({ field: 'Expenses', value: p.expenses });
        worksheet.addRow({ field: 'Profit', value: p.profit });
        break;
      }
      case 'cash-flow': {
        const rows = await this.getCashFlow();
        worksheet.columns = [
          { header: 'Month', key: 'month', width: 15 },
          { header: 'Inflow', key: 'inflow', width: 15 },
          { header: 'Outflow', key: 'outflow', width: 15 },
          { header: 'Net', key: 'net', width: 15 },
        ];
        rows.forEach(r => worksheet.addRow(r));
        break;
      }
      case 'variance': {
        const rows = await this.getVarianceReport(opts.buildingId);
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Year', key: 'year', width: 10 },
          { header: 'Name', key: 'name', width: 30 },
          { header: 'Planned', key: 'planned', width: 15 },
          { header: 'Actual', key: 'actual', width: 15 },
          { header: 'Variance', key: 'variance', width: 15 },
        ];
        rows.forEach(r => worksheet.addRow(r));
        break;
      }
      case 'monthly': {
        const year = opts.year || new Date().getFullYear();
        const month = opts.month || new Date().getMonth() + 1;
        const report = await this.getMonthlyReport(year, month, opts.buildingId);
        
        // Summary section
        worksheet.addRow({ field: 'Monthly Report', value: `${report.month} ${report.year}` });
        worksheet.addRow({ field: 'Building', value: report.buildingName || 'All Buildings' });
        worksheet.addRow({ field: 'Total Income', value: report.totalIncome });
        worksheet.addRow({ field: 'Total Expenses', value: report.totalExpenses });
        worksheet.addRow({ field: 'Balance', value: report.balance });
        worksheet.addRow({});
        
        // Expenses section
        worksheet.addRow({ field: 'EXPENSES BY CATEGORY', value: '' });
        report.expenses.forEach(cat => {
          worksheet.addRow({ field: cat.category, value: cat.total });
        });
        worksheet.addRow({});
        
        // Income section
        worksheet.addRow({ field: 'INCOME BY SOURCE', value: '' });
        report.income.forEach(src => {
          worksheet.addRow({ field: src.source, value: src.total });
        });
        break;
      }
    }

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async exportCsv(type: 'summary' | 'pnl' | 'cash-flow' | 'variance' | 'monthly', opts: { buildingId?: number; year?: number; month?: number }) {
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
      case 'monthly': {
        if (!opts.year || !opts.month) {
          const now = new Date();
          opts.year = now.getFullYear();
          opts.month = now.getMonth() + 1;
        }
        const report = await this.getMonthlyReport(opts.year, opts.month, opts.buildingId);
        const lines = ['Category,Amount'];
        lines.push('Total Income,' + report.totalIncome);
        lines.push('Total Expenses,' + report.totalExpenses);
        lines.push('Balance,' + report.balance);
        return lines.join('\n');
      }
      default:
        return '';
    }
  }

  private async exportPdf(type: 'summary' | 'pnl' | 'cash-flow' | 'variance' | 'monthly', opts: { buildingId?: number; year?: number; month?: number }) {
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


