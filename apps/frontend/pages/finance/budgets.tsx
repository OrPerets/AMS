import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, PencilLine, Save } from 'lucide-react';
import { authFetch, downloadAuthenticatedFile } from '../../lib/auth';
import { BudgetChart } from '../../components/ui/budget-chart';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../components/ui/use-toast';
import { formatCurrency } from '../../lib/utils';

interface ExpenseByCategory {
  category: string;
  _sum: { amount: number };
}

interface Budget {
  id: number;
  name: string;
  year: number;
  amount: number;
  actualSpent: number;
  status: 'PLANNED' | 'ACTIVE' | 'CLOSED';
  notes?: string | null;
  variance: number;
  utilization: number;
  alertLevel: 'normal' | 'warning' | 'critical';
  warningThresholdPercent: number;
  approvalThresholdPercent: number;
  requiresApproval: boolean;
}

interface SummaryResponse {
  budgets: Budget[];
  totals: { planned: number; actual: number; variance: number };
  expensesByCategory: ExpenseByCategory[];
}

export default function BudgetsPage() {
  const currentYear = new Date().getFullYear();
  const [buildingId, setBuildingId] = useState('');
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    year: String(currentYear),
    amount: '',
    notes: '',
    warningThresholdPercent: '80',
    approvalThresholdPercent: '100',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    amount: '',
    notes: '',
    status: 'PLANNED',
    warningThresholdPercent: '80',
    approvalThresholdPercent: '100',
  });
  const [expenseForm, setExpenseForm] = useState({ budgetId: '', category: 'OTHER', amount: '', description: '' });

  async function load() {
    setLoading(true);
    try {
      let activeBuildingId = buildingId;
      if (!activeBuildingId) {
        const budgetsRes = await authFetch('/api/v1/budgets');
        if (budgetsRes.ok) {
          const budgets = await budgetsRes.json();
          activeBuildingId = budgets[0]?.buildingId ? String(budgets[0].buildingId) : '';
          if (activeBuildingId) {
            setBuildingId(activeBuildingId);
          }
        }
      }

      if (!activeBuildingId) {
        setData(null);
        setPendingExpenses([]);
        return;
      }

      const [summaryRes, pendingRes] = await Promise.all([
        authFetch(`/api/v1/budgets/building/${activeBuildingId}/summary`),
        authFetch('/api/v1/budgets/expenses?status=PENDING'),
      ]);

      if (!summaryRes.ok) throw new Error(await summaryRes.text());
      setData(await summaryRes.json());
      setPendingExpenses(pendingRes.ok ? await pendingRes.json() : []);
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת התקציבים נכשלה', variant: 'destructive' });
      setData(null);
      setPendingExpenses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [buildingId]);

  const totals = data?.totals || { planned: 0, actual: 0, variance: 0 };
  const categories = useMemo(
    () => (data?.expensesByCategory || []).map((item) => ({ name: item.category, value: item._sum.amount || 0 })),
    [data],
  );

  async function createBudget() {
    setSubmitting(true);
    try {
      const res = await authFetch('/api/v1/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: Number(buildingId),
          name: form.name,
          year: Number(form.year),
          amount: Number(form.amount),
          notes: form.notes || undefined,
          warningThresholdPercent: Number(form.warningThresholdPercent || 80),
          approvalThresholdPercent: Number(form.approvalThresholdPercent || 100),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'התקציב נוצר' });
      setForm({ name: '', year: String(currentYear), amount: '', notes: '', warningThresholdPercent: '80', approvalThresholdPercent: '100' });
      await load();
    } catch (error) {
      console.error(error);
      toast({ title: 'יצירת התקציב נכשלה', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function saveBudget() {
    if (!editingId) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/v1/budgets/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          amount: Number(editForm.amount),
          notes: editForm.notes,
          status: editForm.status,
          warningThresholdPercent: Number(editForm.warningThresholdPercent || 80),
          approvalThresholdPercent: Number(editForm.approvalThresholdPercent || 100),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'התקציב עודכן' });
      setEditingId(null);
      await load();
    } catch (error) {
      console.error(error);
      toast({ title: 'עדכון התקציב נכשל', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function createExpense() {
    setSubmitting(true);
    try {
      const target = expenseForm.budgetId ? `/api/v1/budgets/${expenseForm.budgetId}/expenses` : '/api/v1/budgets/expenses';
      const res = await authFetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: Number(buildingId),
          budgetId: expenseForm.budgetId ? Number(expenseForm.budgetId) : undefined,
          category: expenseForm.category,
          amount: Number(expenseForm.amount),
          description: expenseForm.description || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'ההוצאה נרשמה וממתינה לאישור' });
      setExpenseForm({ budgetId: '', category: 'OTHER', amount: '', description: '' });
      await load();
    } catch (error) {
      console.error(error);
      toast({ title: 'רישום ההוצאה נכשל', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function reviewExpense(expenseId: number, decision: 'approve' | 'reject') {
    try {
      const res = await authFetch(`/api/v1/budgets/expenses/${expenseId}/${decision}`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: decision === 'approve' ? 'ההוצאה אושרה' : 'ההוצאה נדחתה' });
      await load();
    } catch (error) {
      console.error(error);
      toast({ title: 'עדכון ההוצאה נכשל', variant: 'destructive' });
    }
  }

  const atRiskBudgets = (data?.budgets || []).filter((budget) => budget.alertLevel !== 'normal');

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">תקציבים והוצאות</h1>
          <p className="text-sm text-muted-foreground">מעקב מול ביצוע, עריכת תקציבים והתרעות ניצול.</p>
        </div>
        <div className="flex gap-2">
          {buildingId && (
            <Button variant="outline" onClick={() => downloadAuthenticatedFile(`/api/v1/budgets/building/${buildingId}/summary?format=csv`, `budget-summary-${buildingId}.csv`)}>
              יצוא תקציבים
            </Button>
          )}
          <Input value={buildingId} onChange={(event) => setBuildingId(event.target.value)} placeholder="מזהה בניין" className="w-40" />
          <Button variant="outline" onClick={load} disabled={loading}>רענן</Button>
        </div>
      </div>

      {atRiskBudgets.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              התראות תקציב
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-950">
            {atRiskBudgets.map((budget) => (
              <div key={budget.id}>
                {budget.name}: {budget.utilization.toFixed(0)}% ניצול, סטייה {formatCurrency(budget.variance)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>מתוכנן</CardTitle></CardHeader><CardContent>{formatCurrency(totals.planned)}</CardContent></Card>
        <Card><CardHeader><CardTitle>בפועל</CardTitle></CardHeader><CardContent>{formatCurrency(totals.actual)}</CardContent></Card>
        <Card><CardHeader><CardTitle>סטייה</CardTitle></CardHeader><CardContent>{formatCurrency(totals.variance)}</CardContent></Card>
      </div>

      <BudgetChart planned={totals.planned} actual={totals.actual} categories={categories} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>יצירת תקציב</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="שם תקציב" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Input type="number" placeholder="שנה" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} />
            <Input type="number" placeholder="סכום" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
            <Input placeholder="הערות" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <Input type="number" placeholder="סף אזהרה %" value={form.warningThresholdPercent} onChange={(event) => setForm({ ...form, warningThresholdPercent: event.target.value })} />
            <Input type="number" placeholder="סף אישור %" value={form.approvalThresholdPercent} onChange={(event) => setForm({ ...form, approvalThresholdPercent: event.target.value })} />
            <Button onClick={createBudget} disabled={submitting || !form.name || !form.amount}>שמור תקציב</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>רישום הוצאה</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="מזהה תקציב (אופציונלי)" value={expenseForm.budgetId} onChange={(event) => setExpenseForm({ ...expenseForm, budgetId: event.target.value })} />
            <select className="rounded-md border px-3 py-2 text-start" value={expenseForm.category} onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })}>
              {['MAINTENANCE', 'UTILITIES', 'STAFF', 'ADMINISTRATION', 'OTHER'].map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <Input type="number" placeholder="סכום" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} />
            <Input placeholder="תיאור" value={expenseForm.description} onChange={(event) => setExpenseForm({ ...expenseForm, description: event.target.value })} />
            <Button onClick={createExpense} disabled={submitting || !expenseForm.amount}>שמור הוצאה</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>תקציבים</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-start">
                  <th className="py-2">שם</th>
                  <th className="py-2">שנה</th>
                  <th className="py-2">סטטוס</th>
                  <th className="py-2">מתוכנן</th>
                  <th className="py-2">בפועל</th>
                  <th className="py-2">ניצול</th>
                  <th className="py-2">ספי בקרה</th>
                  <th className="py-2">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {(data?.budgets || []).map((budget) => (
                  <tr key={budget.id} className="border-b">
                    <td className="py-3">{budget.name}</td>
                    <td className="py-3">{budget.year}</td>
                    <td className="py-3"><Badge variant={budget.status === 'ACTIVE' ? 'success' : 'outline'}>{budget.status}</Badge></td>
                    <td className="py-3">{formatCurrency(budget.amount)}</td>
                    <td className="py-3">{formatCurrency(budget.actualSpent)}</td>
                    <td className="py-3">{budget.utilization.toFixed(0)}%</td>
                    <td className="py-3 text-xs">
                      <div>אזהרה {budget.warningThresholdPercent}%</div>
                      <div>אישור {budget.approvalThresholdPercent}%</div>
                      {budget.requiresApproval && <Badge variant="destructive">דורש אישור</Badge>}
                    </td>
                    <td className="py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(budget.id);
                          setEditForm({
                            name: budget.name,
                            amount: String(budget.amount),
                            notes: budget.notes || '',
                            status: budget.status,
                            warningThresholdPercent: String(budget.warningThresholdPercent),
                            approvalThresholdPercent: String(budget.approvalThresholdPercent),
                          });
                        }}
                      >
                        <PencilLine className="me-2 h-4 w-4" />
                        ערוך
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingId && (
            <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
              <Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
              <Input type="number" value={editForm.amount} onChange={(event) => setEditForm({ ...editForm, amount: event.target.value })} />
              <Input value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} />
              <select className="rounded-md border px-3 py-2" value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}>
                {['PLANNED', 'ACTIVE', 'CLOSED'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <Input type="number" value={editForm.warningThresholdPercent} onChange={(event) => setEditForm({ ...editForm, warningThresholdPercent: event.target.value })} />
              <Input type="number" value={editForm.approvalThresholdPercent} onChange={(event) => setEditForm({ ...editForm, approvalThresholdPercent: event.target.value })} />
              <div className="md:col-span-2 flex gap-2">
                <Button onClick={saveBudget} disabled={submitting}>
                  <Save className="me-2 h-4 w-4" />
                  שמור שינויים
                </Button>
                <Button variant="outline" onClick={() => setEditingId(null)}>ביטול</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>הוצאות ממתינות לאישור</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {pendingExpenses.length === 0 && <div className="text-sm text-muted-foreground">אין הוצאות ממתינות.</div>}
          {pendingExpenses.map((expense) => (
            <div key={expense.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium">{expense.category} · {formatCurrency(Number(expense.amount))}</div>
                <div className="text-sm text-muted-foreground">{expense.description || 'ללא תיאור'}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => reviewExpense(expense.id, 'approve')}>אשר</Button>
                <Button size="sm" variant="outline" onClick={() => reviewExpense(expense.id, 'reject')}>דחה</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
