export class MonthlyReportDto {
  month!: string;
  year!: number;
  expenses!: ExpenseCategory[];
  income!: IncomeSource[];
  totalExpenses!: number;
  totalIncome!: number;
  balance!: number;
  buildingId?: number;
  buildingName?: string;
}

export class ExpenseCategory {
  category!: string;
  items!: ExpenseItem[];
  total!: number;
}

export class ExpenseItem {
  date!: Date;
  description!: string;
  amount!: number;
  vendor?: string;
  invoiceNumber?: string;
  referenceType?: string; // 'EXPENSE' | 'WORK_ORDER' | 'MAINTENANCE'
  referenceId?: number;
}

export class IncomeSource {
  source!: string;
  items!: IncomeItem[];
  total!: number;
}

export class IncomeItem {
  date!: Date;
  description!: string;
  amount!: number;
  tenant?: string;
  paymentMethod?: string;
  invoiceId?: number;
}

export class YearlyReportDto {
  year!: number;
  months!: MonthlyReportDto[];
  totalIncome!: number;
  totalExpenses!: number;
  totalBalance!: number;
  buildingId?: number;
  buildingName?: string;
}

export class ComparisonReportDto {
  period1!: MonthlyReportDto | YearlyReportDto;
  period2!: MonthlyReportDto | YearlyReportDto;
  differences!: {
    incomeDiff: number;
    expensesDiff: number;
    balanceDiff: number;
    incomePercentChange: number;
    expensesPercentChange: number;
  };
}

