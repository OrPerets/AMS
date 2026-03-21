import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, LineChart } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { MonthlyReportCard } from '../../components/finance/MonthlyReportCard';
import { ExpenseBreakdownChart } from '../../components/finance/ExpenseBreakdownChart';
import { TrendChart } from '../../components/finance/TrendChart';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { Input } from '../../components/ui/input';
import { TableListSkeleton } from '../../components/ui/page-states';
import { PageHero } from '../../components/ui/page-hero';
import { SectionHeader } from '../../components/ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { StatusBadge } from '../../components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

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
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [buildingId, setBuildingId] = useState('');
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
  const [previousMonthReport, setPreviousMonthReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('xlsx');

  async function parseReportResponse(response: Response, emptyStatuses: number[] = [404]) {
    if (response.ok) {
      return response.json();
    }
    if (emptyStatuses.includes(response.status)) {
      return null;
    }
    throw new Error(await response.text());
  }

  async function loadMonthlyReport() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ year: selectedYear, month: selectedMonth });
      if (buildingId) params.append('buildingId', buildingId);
      const reportResponse = await authFetch('/api/v1/reports/financial/monthly?' + params.toString());
      const report = await parseReportResponse(reportResponse);
      setMonthlyReport(report);

      const monthNumber = Number(selectedMonth);
      const prevMonth = monthNumber === 1 ? '12' : String(monthNumber - 1);
      const prevYear = monthNumber === 1 ? String(Number(selectedYear) - 1) : selectedYear;
      const prevParams = new URLSearchParams({ year: prevYear, month: prevMonth });
      if (buildingId) prevParams.append('buildingId', buildingId);
      const previousResponse = await authFetch('/api/v1/reports/financial/monthly?' + prevParams.toString());
      const previous = await parseReportResponse(previousResponse);
      setPreviousMonthReport(previous);
      setYearlyReport(null);
    } catch {
      setError('לא ניתן לטעון את הדוח החודשי כרגע.');
      setMonthlyReport(null);
      setPreviousMonthReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadYearlyReport() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ year: selectedYear });
      if (buildingId) params.append('buildingId', buildingId);
      const response = await authFetch('/api/v1/reports/financial/yearly?' + params.toString());
      const report = await parseReportResponse(response);
      setYearlyReport(report);
      setMonthlyReport(null);
      setPreviousMonthReport(null);
    } catch {
      setError('לא ניתן לטעון את הדוח השנתי כרגע.');
      setYearlyReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (viewMode === 'monthly') {
      loadMonthlyReport();
      return;
    }
    loadYearlyReport();
  }, [viewMode, selectedYear, selectedMonth, buildingId]);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set('format', format);
    params.set('year', selectedYear);
    if (viewMode === 'monthly') params.set('month', selectedMonth);
    if (buildingId) params.set('buildingId', buildingId);
    return '/api/v1/reports/financial/export/' + viewMode + '?' + params.toString();
  }, [buildingId, format, selectedMonth, selectedYear, viewMode]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  const months = [
    { value: '1', label: 'ינואר' },
    { value: '2', label: 'פברואר' },
    { value: '3', label: 'מרץ' },
    { value: '4', label: 'אפריל' },
    { value: '5', label: 'מאי' },
    { value: '6', label: 'יוני' },
    { value: '7', label: 'יולי' },
    { value: '8', label: 'אוגוסט' },
    { value: '9', label: 'ספטמבר' },
    { value: '10', label: 'אוקטובר' },
    { value: '11', label: 'נובמבר' },
    { value: '12', label: 'דצמבר' },
  ];

  const reportTitle = viewMode === 'monthly' ? 'דוח חודשי' : 'דוח שנתי';

  return (
    <div className="space-y-8">
      <PageHero
        kicker="Finance base styling refreshed"
        eyebrow={
          <>
            <StatusBadge label="Finance" tone="finance" className="border-white/15 bg-white/10 text-white" />
            <StatusBadge label={reportTitle} tone="success" className="border-emerald-300/20 bg-emerald-400/10 text-emerald-100" />
          </>
        }
        title="דוחות פיננסיים"
        description="שכבת הבסיס של המסך עברה לשפה המותגית החדשה: היררכיית כותרות, פילטרים אחידים, כרטיסי KPI ומשטחי פירוט."
        actions={
          <>
            <Button asChild variant="hero">
              <Link href="/finance/analytics">
                <LineChart className="me-2 h-4 w-4" />
                אנליטיקה
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <a href={exportHref} download>
                <Download className="me-2 h-4 w-4" />
                ייצוא
              </a>
            </Button>
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-2 text-white">
            <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">מצב</div>
              <div className="mt-2 text-2xl font-black">{viewMode === 'monthly' ? 'חודשי' : 'שנתי'}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">שנה</div>
              <div className="mt-2 text-2xl font-black">{selectedYear}</div>
            </div>
          </div>
        }
      />

      <Card variant="elevated">
        <CardContent className="space-y-6 p-6">
          <SectionHeader
            title="פילטרים וייצוא"
            subtitle="המעבר לרכיבים משותפים נועד לצמצם עיצוב אפור גנרי וליישר קו עם שאר המסכים הממותגים."
            meta="Sprint 1"
            actions={
              <div className="flex flex-wrap gap-3">
                <Button size="sm" variant={viewMode === 'monthly' ? 'default' : 'outline'} onClick={() => setViewMode('monthly')}>
                  חודשי
                </Button>
                <Button size="sm" variant={viewMode === 'yearly' ? 'default' : 'outline'} onClick={() => setViewMode('yearly')}>
                  שנתי
                </Button>
              </div>
            }
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">שנה</div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {viewMode === 'monthly' ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">חודש</div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map((month) => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">בניין</div>
              <Input value={buildingId} onChange={(e) => setBuildingId(e.target.value)} placeholder="מזהה בניין או השאר ריק" />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">פורמט ייצוא</div>
              <Select value={format} onValueChange={(value) => setFormat(value as 'csv' | 'xlsx' | 'pdf')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <TableListSkeleton rows={6} columns={4} />
      ) : error ? (
        <InlineErrorPanel title="הדוח הפיננסי לא נטען" description={error} onRetry={viewMode === 'monthly' ? loadMonthlyReport : loadYearlyReport} />
      ) : viewMode === 'monthly' && monthlyReport ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MonthlyReportCard title="סה״כ הכנסות" value={monthlyReport.totalIncome} previousValue={previousMonthReport?.totalIncome} colorScheme="income" />
            <MonthlyReportCard title="סה״כ הוצאות" value={monthlyReport.totalExpenses} previousValue={previousMonthReport?.totalExpenses} colorScheme="expense" />
            <MonthlyReportCard title="יתרה" value={monthlyReport.balance} previousValue={previousMonthReport?.balance} colorScheme="balance" />
          </div>

          <Card variant="elevated">
            <CardContent className="space-y-4 p-6">
              <SectionHeader
                title="סיכום הדוח"
                subtitle="הפלט הראשי מחולק כעת לבלוקים ברורים: הכנסות, הוצאות והשוואה חודשית."
                meta={monthlyReport.buildingName ?? 'כל הבניינים'}
              />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[20px] border border-subtle-border bg-muted/50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-tertiary">חודש</div>
                  <div className="mt-2 text-xl font-black text-foreground">{monthlyReport.month} {monthlyReport.year}</div>
                </div>
                <div className="rounded-[20px] border border-subtle-border bg-muted/50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-tertiary">שינוי מול חודש קודם</div>
                  <div className="mt-2 text-xl font-black text-foreground">
                    {previousMonthReport ? `₪${(monthlyReport.balance - previousMonthReport.balance).toLocaleString()}` : 'אין נתון'}
                  </div>
                </div>
                <div className="rounded-[20px] border border-subtle-border bg-muted/50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-tertiary">פילטר בניין</div>
                  <div className="mt-2 text-xl font-black text-foreground">{buildingId || 'ללא סינון'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <ExpenseBreakdownChart expenses={monthlyReport.expenses} title={'פילוח הוצאות - ' + monthlyReport.month + ' ' + monthlyReport.year} />
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>פירוט הכנסות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {monthlyReport.income.map((src, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-[18px] border border-subtle-border bg-muted/50 px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{src.source}</span>
                    <StatusBadge label={'₪' + src.total.toLocaleString()} tone="success" />
                  </div>
                ))}
                {monthlyReport.income.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">אין נתוני הכנסות להצגה</div> : null}
              </CardContent>
            </Card>
          </div>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>פירוט הוצאות לפי קטגוריה</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyReport.expenses.length === 0 ? (
                <EmptyState
                  type="empty"
                  title="אין הוצאות להצגה בחודש שנבחר"
                  description="כאשר יהיו תנועות הוצאה בחתך הזה, הפירוט לפי קטגוריה יופיע כאן."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">קטגוריה</TableHead>
                      <TableHead className="text-right">פריטים</TableHead>
                      <TableHead className="text-right">סכום</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyReport.expenses.map((cat, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{cat.category}</TableCell>
                        <TableCell>{cat.items.length}</TableCell>
                        <TableCell className="font-medium text-destructive">₪{cat.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : viewMode === 'yearly' && yearlyReport ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MonthlyReportCard title={'סה״כ הכנסות ' + yearlyReport.year} value={yearlyReport.totalIncome} colorScheme="income" />
            <MonthlyReportCard title={'סה״כ הוצאות ' + yearlyReport.year} value={yearlyReport.totalExpenses} colorScheme="expense" />
            <MonthlyReportCard title={'יתרה ' + yearlyReport.year} value={yearlyReport.totalBalance} colorScheme="balance" />
          </div>
          <TrendChart data={yearlyReport.months} />
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>פירוט חודשי</CardTitle>
            </CardHeader>
            <CardContent>
              {yearlyReport.months.length === 0 ? (
                <EmptyState
                  type="empty"
                  title="אין חודשים להצגה בדוח השנתי"
                  description="נסה לבחור שנה אחרת או להסיר את סינון הבניין."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">חודש</TableHead>
                      <TableHead className="text-right">הכנסות</TableHead>
                      <TableHead className="text-right">הוצאות</TableHead>
                      <TableHead className="text-right">יתרה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearlyReport.months.map((month, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{month.month}</TableCell>
                        <TableCell className="text-success">₪{month.totalIncome.toLocaleString()}</TableCell>
                        <TableCell className="text-destructive">₪{month.totalExpenses.toLocaleString()}</TableCell>
                        <TableCell className={month.balance >= 0 ? 'font-medium text-success' : 'font-medium text-destructive'}>
                          ₪{month.balance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card variant="elevated">
          <CardContent className="p-10">
            <EmptyState
              type="empty"
              title="לא נמצאו נתונים להצגה"
              description="נסה לבחור חודש או שנה אחרים, או הסר את סינון הבניין כדי להרחיב את התוצאות."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
