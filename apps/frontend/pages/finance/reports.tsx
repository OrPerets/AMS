import React, { useEffect, useState } from 'react';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { MonthlyReportCard } from '../../components/finance/MonthlyReportCard';
import { ExpenseBreakdownChart } from '../../components/finance/ExpenseBreakdownChart';
import { TrendChart } from '../../components/finance/TrendChart';

interface MonthlyReport {
  month: string;
  year: number;
  expenses: Array<{ category: string; items: any[]; total: number }>;
  income: Array<{ source: string; items: any[]; total: number }>;
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  buildingId?: number;
  buildingName?: string;
}

interface YearlyReport {
  year: number;
  months: MonthlyReport[];
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  buildingId?: number;
  buildingName?: string;
}

export default function FinancialReportsPage() {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [buildingId, setBuildingId] = useState<string>('');
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
  const [previousMonthReport, setPreviousMonthReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('xlsx');

  const loadMonthlyReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });
      if (buildingId) params.append('buildingId', buildingId);

      const report = await authFetch(`/api/v1/reports/financial/monthly?${params}`)
        .then(r => r.ok ? r.json() : null);
      
      setMonthlyReport(report);

      // Load previous month for comparison
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      const prevParams = new URLSearchParams({
        year: prevYear.toString(),
        month: prevMonth.toString(),
      });
      if (buildingId) prevParams.append('buildingId', buildingId);

      const prevReport = await authFetch(`/api/v1/reports/financial/monthly?${prevParams}`)
        .then(r => r.ok ? r.json() : null);
      
      setPreviousMonthReport(prevReport);
    } catch (error) {
      console.error('Error loading monthly report:', error);
    }
    setLoading(false);
  };

  const loadYearlyReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
      });
      if (buildingId) params.append('buildingId', buildingId);

      const report = await authFetch(`/api/v1/reports/financial/yearly?${params}`)
        .then(r => r.ok ? r.json() : null);
      
      setYearlyReport(report);
    } catch (error) {
      console.error('Error loading yearly report:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (viewMode === 'monthly') {
      loadMonthlyReport();
    } else {
      loadYearlyReport();
    }
  }, [viewMode, selectedYear, selectedMonth, buildingId]);

  const getExportUrl = () => {
    const params = new URLSearchParams();
    params.set('format', format);
    if (viewMode === 'monthly') {
      params.set('year', selectedYear.toString());
      params.set('month', selectedMonth.toString());
    } else {
      params.set('year', selectedYear.toString());
    }
    if (buildingId) params.set('buildingId', buildingId);

    return `/api/v1/reports/financial/export/${viewMode}?${params}`;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'ינואר' },
    { value: 2, label: 'פברואר' },
    { value: 3, label: 'מרץ' },
    { value: 4, label: 'אפריל' },
    { value: 5, label: 'מאי' },
    { value: 6, label: 'יוני' },
    { value: 7, label: 'יולי' },
    { value: 8, label: 'אוגוסט' },
    { value: 9, label: 'ספטמבר' },
    { value: 10, label: 'אוקטובר' },
    { value: 11, label: 'נובמבר' },
    { value: 12, label: 'דצמבר' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">דוחות פיננסיים</h1>
          <div className="flex items-center gap-2">
            <a href="/finance/analytics">
              <Button size="sm" variant="outline">אנליטיקה</Button>
            </a>
            <Button
              size="sm"
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              onClick={() => setViewMode('monthly')}
            >
              חודשי
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'yearly' ? 'default' : 'outline'}
              onClick={() => setViewMode('yearly')}
            >
              שנתי
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">שנה</label>
            <select
              className="border rounded px-3 py-2"
              value={selectedYear}
              onChange={(e) => setSelectedYear(+e.target.value)}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {viewMode === 'monthly' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">חודש</label>
              <select
                className="border rounded px-3 py-2"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(+e.target.value)}
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">בניין (אופציונלי)</label>
            <input
              className="border rounded px-3 py-2"
              placeholder="מזהה בניין"
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">פורמט ייצוא</label>
            <select
              className="border rounded px-2 py-2"
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <a href={getExportUrl()} download>
            <Button size="sm">ייצא דוח</Button>
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">טוען נתונים...</div>
        </div>
      ) : viewMode === 'monthly' && monthlyReport ? (
        <>
          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MonthlyReportCard
              title="סה״כ הכנסות"
              value={monthlyReport.totalIncome}
              previousValue={previousMonthReport?.totalIncome}
              colorScheme="income"
            />
            <MonthlyReportCard
              title="סה״כ הוצאות"
              value={monthlyReport.totalExpenses}
              previousValue={previousMonthReport?.totalExpenses}
              colorScheme="expense"
            />
            <MonthlyReportCard
              title="יתרה"
              value={monthlyReport.balance}
              previousValue={previousMonthReport?.balance}
              colorScheme="balance"
            />
          </div>

          {/* Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ExpenseBreakdownChart
              expenses={monthlyReport.expenses}
              title={`פילוח הוצאות - ${monthlyReport.month} ${monthlyReport.year}`}
            />

            {/* Income Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>פירוט הכנסות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyReport.income.map((src, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-2 border-b">
                      <span className="text-gray-700">{src.source}</span>
                      <span className="font-semibold text-green-600">
                        ₪{src.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {monthlyReport.income.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      אין נתוני הכנסות להצגה
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Expense Table */}
          <Card>
            <CardHeader>
              <CardTitle>פירוט הוצאות לפי קטגוריה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-right border-b">
                      <th className="p-2 font-semibold">קטגוריה</th>
                      <th className="p-2 font-semibold">פריטים</th>
                      <th className="p-2 font-semibold">סכום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReport.expenses.map((cat, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2">{cat.category}</td>
                        <td className="p-2">{cat.items.length}</td>
                        <td className="p-2 font-medium text-red-600">
                          ₪{cat.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2">
                      <td className="p-2">סה״כ</td>
                      <td className="p-2">{monthlyReport.expenses.reduce((sum, cat) => sum + cat.items.length, 0)}</td>
                      <td className="p-2 text-red-600">₪{monthlyReport.totalExpenses.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : viewMode === 'yearly' && yearlyReport ? (
        <>
          {/* Yearly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MonthlyReportCard
              title={`סה״כ הכנסות ${yearlyReport.year}`}
              value={yearlyReport.totalIncome}
              colorScheme="income"
            />
            <MonthlyReportCard
              title={`סה״כ הוצאות ${yearlyReport.year}`}
              value={yearlyReport.totalExpenses}
              colorScheme="expense"
            />
            <MonthlyReportCard
              title={`יתרה ${yearlyReport.year}`}
              value={yearlyReport.totalBalance}
              colorScheme="balance"
            />
          </div>

          {/* 12-Month Trend */}
          <TrendChart data={yearlyReport.months} />

          {/* Monthly Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>פירוט חודשי - {yearlyReport.year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-right border-b">
                      <th className="p-2 font-semibold">חודש</th>
                      <th className="p-2 font-semibold">הכנסות</th>
                      <th className="p-2 font-semibold">הוצאות</th>
                      <th className="p-2 font-semibold">יתרה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyReport.months.map((month, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2">{month.month}</td>
                        <td className="p-2 text-green-600">₪{month.totalIncome.toLocaleString()}</td>
                        <td className="p-2 text-red-600">₪{month.totalExpenses.toLocaleString()}</td>
                        <td className={`p-2 font-medium ${month.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₪{month.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2">
                      <td className="p-2">סה״כ</td>
                      <td className="p-2 text-green-600">₪{yearlyReport.totalIncome.toLocaleString()}</td>
                      <td className="p-2 text-red-600">₪{yearlyReport.totalExpenses.toLocaleString()}</td>
                      <td className={`p-2 ${yearlyReport.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₪{yearlyReport.totalBalance.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          לא נמצאו נתונים
        </div>
      )}
    </div>
  );
}
