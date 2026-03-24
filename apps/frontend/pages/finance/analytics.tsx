import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../lib/auth';
import { MonthlyReportCard } from '../../components/finance/MonthlyReportCard';
import { TrendChart } from '../../components/finance/TrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { formatCurrency } from '../../lib/utils';

interface SummaryResponse {
  planned: number;
  actual: number;
  variance: number;
  expensesByCategory: Array<{ category: string; _sum: { amount: number } }>;
}

interface CashFlowRow {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface VarianceRow {
  id: number;
  name: string;
  year: number;
  planned: number;
  actual: number;
  variance: number;
}

interface ForecastResponse {
  forecastedMonthlyRevenue: number;
  forecastedMonthlyExpense: number;
  forecastedMonthlyProfit: number;
}

interface CollectionsSummary {
  totals: {
    overdueCount: number;
    outstandingBalance: number;
    delinquencyRate: number;
    billedThisMonth: number;
    collectedThisMonth: number;
  };
  aging: Record<string, number>;
}

export default function FinancialAnalyticsPage() {
  const [buildingId, setBuildingId] = useState('');
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowRow[]>([]);
  const [variance, setVariance] = useState<VarianceRow[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [collections, setCollections] = useState<CollectionsSummary | null>(null);

  async function load() {
    const qs = new URLSearchParams();
    if (buildingId) qs.set('buildingId', buildingId);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';

    const [summaryRes, cashFlowRes, varianceRes, forecastRes, collectionsRes] = await Promise.all([
      authFetch(`/api/v1/reports/financial/summary${suffix}`),
      authFetch(`/api/v1/reports/financial/cash-flow${suffix}`),
      authFetch(`/api/v1/reports/financial/variance${suffix}`),
      authFetch(`/api/v1/reports/financial/forecast${suffix}`),
      authFetch(`/api/v1/invoices/collections/summary${suffix}`),
    ]);

    setSummary(summaryRes.ok ? await summaryRes.json() : null);
    setCashFlow(cashFlowRes.ok ? await cashFlowRes.json() : []);
    setVariance(varianceRes.ok ? await varianceRes.json() : []);
    setForecast(forecastRes.ok ? await forecastRes.json() : null);
    setCollections(collectionsRes.ok ? await collectionsRes.json() : null);
  }

  useEffect(() => {
    load();
  }, [buildingId]);

  const trendData = useMemo(
    () =>
      cashFlow.map((row) => ({
        month: row.month,
        totalIncome: row.inflow,
        totalExpenses: row.outflow,
        balance: row.net,
      })),
    [cashFlow],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">אנליטיקה פיננסית</h1>
          <p className="text-sm text-muted-foreground">מגמות תזרים, תחזית ומעקב חריגות תקציב.</p>
        </div>
        <div className="flex gap-2">
          <Input className="w-44" placeholder="מזהה בניין" value={buildingId} onChange={(event) => setBuildingId(event.target.value)} />
          <Button variant="outline" onClick={load}>רענן</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MonthlyReportCard title="מתוכנן" value={summary?.planned || 0} />
        <MonthlyReportCard title="בפועל" value={summary?.actual || 0} colorScheme="expense" />
        <MonthlyReportCard title="סטייה" value={summary?.variance || 0} colorScheme="balance" />
        <MonthlyReportCard title="תחזית רווח" value={forecast?.forecastedMonthlyProfit || 0} colorScheme="balance" />
      </div>

      {collections && (
        <div className="grid gap-4 md:grid-cols-4">
          <MonthlyReportCard title="יתרת חוב" value={collections.totals.outstandingBalance} colorScheme="expense" />
          <MonthlyReportCard title="שיעור פיגור" value={collections.totals.delinquencyRate} currency="" />
          <MonthlyReportCard title="חויב החודש" value={collections.totals.billedThisMonth} />
          <MonthlyReportCard title="נגבה החודש" value={collections.totals.collectedThisMonth} colorScheme="income" />
        </div>
      )}

      <TrendChart data={trendData} title="תזרים מזומנים" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>תחזית חודשית</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>הכנסות חזויות: {formatCurrency(forecast?.forecastedMonthlyRevenue || 0)}</div>
            <div>הוצאות חזויות: {formatCurrency(forecast?.forecastedMonthlyExpense || 0)}</div>
            <div>רווח חזוי: {formatCurrency(forecast?.forecastedMonthlyProfit || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>פילוח הוצאות לפי קטגוריה</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(summary?.expensesByCategory || []).map((category) => (
              <div key={category.category} className="flex items-center justify-between border-b pb-2">
                <span>{category.category}</span>
                <span>{formatCurrency(category._sum.amount || 0)}</span>
              </div>
            ))}
            {(summary?.expensesByCategory || []).length === 0 && (
              <div className="text-muted-foreground">אין נתונים להצגה.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>התיישנות חוב</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {collections && Object.entries(collections.aging).map(([bucket, amount]) => (
              <div key={bucket} className="flex items-center justify-between border-b pb-2">
                <span>{bucket}</span>
                <span>{formatCurrency(amount || 0)}</span>
              </div>
            ))}
            {!collections && <div className="text-muted-foreground">אין נתוני גבייה להצגה.</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>חריגות תקציב</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-start">
                  <th className="py-2">שנה</th>
                  <th className="py-2">תקציב</th>
                  <th className="py-2">מתוכנן</th>
                  <th className="py-2">בפועל</th>
                  <th className="py-2">סטייה</th>
                </tr>
              </thead>
              <tbody>
                {variance.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-3">{row.year}</td>
                    <td className="py-3">{row.name}</td>
                    <td className="py-3">{formatCurrency(row.planned)}</td>
                    <td className="py-3">{formatCurrency(row.actual)}</td>
                    <td className={`py-3 ${row.variance < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(row.variance)}</td>
                  </tr>
                ))}
                {variance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">אין תקציבים להצגה.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
