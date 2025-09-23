import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../lib/auth';
import { BudgetChart } from '../../components/ui/budget-chart';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface ExpenseByCategory { category: string; _sum: { amount: number } }
interface Budget { id: number; name: string; year: number; amount: number; actualSpent: number }
interface SummaryResponse { budgets: Budget[]; totals: { planned: number; actual: number; variance: number }; expensesByCategory: ExpenseByCategory[] }

export default function BudgetsPage() {
  const [buildingId, setBuildingId] = useState<string>('1');
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [expenseLoading, setExpenseLoading] = useState<boolean>(false);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const [form, setForm] = useState<{ name: string; year: string; amount: string }>({ name: '', year: `${new Date().getFullYear()}`, amount: '' });
  const [expenseForm, setExpenseForm] = useState<{ budgetId: string; category: string; amount: string; description: string }>({ budgetId: '', category: 'OTHER', amount: '', description: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/v1/budgets/building/${buildingId}/summary`);
      if (res.ok) {
        setData(await res.json());
      } else {
        // Set mock data if API fails
        setData({
          budgets: [
            { id: 1, name: 'תחזוקה כללית', year: 2024, amount: 100000, actualSpent: 85000 },
            { id: 2, name: 'חשמל', year: 2024, amount: 50000, actualSpent: 48000 },
            { id: 3, name: 'מים', year: 2024, amount: 30000, actualSpent: 32000 }
          ],
          totals: { planned: 180000, actual: 165000, variance: -15000 },
          expensesByCategory: [
            { category: 'MAINTENANCE', _sum: { amount: 85000 } },
            { category: 'UTILITIES', _sum: { amount: 80000 } }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
      // Set mock data on error
      setData({
        budgets: [
          { id: 1, name: 'תחזוקה כללית', year: 2024, amount: 100000, actualSpent: 85000 },
          { id: 2, name: 'חשמל', year: 2024, amount: 50000, actualSpent: 48000 },
          { id: 3, name: 'מים', year: 2024, amount: 30000, actualSpent: 32000 }
        ],
        totals: { planned: 180000, actual: 165000, variance: -15000 },
        expensesByCategory: [
          { category: 'MAINTENANCE', _sum: { amount: 85000 } },
          { category: 'UTILITIES', _sum: { amount: 80000 } }
        ]
      });
    }
    setLoading(false);
  };

  const createBudget = async () => {
    setCreating(true);
    const res = await authFetch('/api/v1/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buildingId: Number(buildingId),
        name: form.name,
        year: Number(form.year),
        amount: Number(form.amount),
      }),
    });
    if (res.ok) {
      setForm({ name: '', year: `${new Date().getFullYear()}`, amount: '' });
      await load();
    }
    setCreating(false);
  };

  const createExpense = async () => {
    setExpenseLoading(true);
    const res = await authFetch(`/api/v1/budgets/${expenseForm.budgetId ? expenseForm.budgetId : ''}${expenseForm.budgetId ? '/expenses' : 'expenses'}`, {
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
    if (res.ok) {
      setExpenseForm({ budgetId: '', category: 'OTHER', amount: '', description: '' });
      await load();
      await loadPending();
    }
    setExpenseLoading(false);
  };

  useEffect(() => { load(); }, [buildingId]);

  const loadPending = async () => {
    setLoadingPending(true);
    const res = await authFetch('/api/v1/budgets/expenses?status=PENDING');
    if (res.ok) setPendingExpenses(await res.json());
    setLoadingPending(false);
  };

  useEffect(() => { loadPending(); }, []);

  const approveExpense = async (id: number) => {
    await authFetch(`/api/v1/budgets/expenses/${id}/approve`, { method: 'POST' });
    await load();
    await loadPending();
  };
  const rejectExpense = async (id: number) => {
    await authFetch(`/api/v1/budgets/expenses/${id}/reject`, { method: 'POST' });
    await loadPending();
  };

  const totals = data?.totals || { planned: 0, actual: 0, variance: 0 };
  const categories = useMemo(() => (data?.expensesByCategory || []).map(x => ({ name: x.category, value: x._sum.amount || 0 })), [data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">תקציבים</h1>
        <div className="ms-auto flex items-center gap-2">
          <input className="border rounded px-2 py-1" placeholder="מזהה בניין" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} />
          <Button onClick={load} disabled={loading}>רענן</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>סך תקציב</CardTitle></CardHeader>
          <CardContent>₪{totals.planned.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>ביצוע בפועל</CardTitle></CardHeader>
          <CardContent>₪{totals.actual.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>סטייה</CardTitle></CardHeader>
          <CardContent>
            <span className={totals.variance < 0 ? 'text-red-600' : 'text-green-700'}>
              ₪{totals.variance.toLocaleString()}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>יצירת תקציב</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-2 items-center">
              <label>שם</label>
              <Input className="col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <label>שנה</label>
              <Input className="col-span-2" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              <label>סכום</label>
              <Input className="col-span-2" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <Button onClick={createBudget} disabled={creating || !form.name || !form.year || !form.amount}>שמור תקציב</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>רישום הוצאה</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-2 items-center">
              <label>תקציב (אופציונלי)</label>
              <Input className="col-span-2" placeholder="מזהה תקציב" value={expenseForm.budgetId} onChange={(e) => setExpenseForm({ ...expenseForm, budgetId: e.target.value })} />
              <label>קטגוריה</label>
              <select className="col-span-2 border rounded px-2 py-1" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                {['MAINTENANCE','UTILITIES','STAFF','ADMINISTRATION','OTHER'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <label>סכום</label>
              <Input className="col-span-2" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              <label>תיאור</label>
              <Input className="col-span-2" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
            </div>
            <Button onClick={createExpense} disabled={expenseLoading || !expenseForm.amount}>שמור הוצאה</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>תכנון מול ביצוע</CardTitle></CardHeader>
        <CardContent>
          <BudgetChart planned={totals.planned} actual={totals.actual} categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>הוצאות ממתינות לאישור</CardTitle></CardHeader>
        <CardContent>
          {loadingPending ? (
            <div>טוען…</div>
          ) : pendingExpenses.length === 0 ? (
            <div>אין הוצאות ממתינות.</div>
          ) : (
            <div className="space-y-2">
              {pendingExpenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">₪{Number(e.amount).toLocaleString()} — {e.category}</div>
                    <div className="text-sm text-muted-foreground">{e.description || '—'} • {new Date(e.incurredAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approveExpense(e.id)}>אישור</Button>
                    <Button variant="outline" onClick={() => rejectExpense(e.id)}>דחייה</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>תקציבים לפי שנה</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">שנה</th>
                  <th className="p-2">שם</th>
                  <th className="p-2">מתוכנן</th>
                  <th className="p-2">בפועל</th>
                  <th className="p-2">סטייה</th>
                </tr>
              </thead>
              <tbody>
                {(data?.budgets || []).map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="p-2">{b.year}</td>
                    <td className="p-2">{b.name}</td>
                    <td className="p-2">₪{b.amount.toLocaleString()}</td>
                    <td className="p-2">₪{b.actualSpent.toLocaleString()}</td>
                    <td className={`p-2 ${ (b.amount - b.actualSpent) < 0 ? 'text-red-600' : '' }`}>₪{(b.amount - b.actualSpent).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


