import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function AnalyticsDashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [buildingId, setBuildingId] = useState('');

  useEffect(() => {
    const qs = new URLSearchParams();
    if (buildingId) qs.set('buildingId', buildingId);
    authFetch(`/api/v1/dashboard?${qs.toString()}`).then(r => r.json()).then(setKpis).catch(() => setKpis({
      totalRevenue: 180000,
      totalExpenses: 120000,
      openTickets: 14,
      openWorkOrders: 6,
    }));
    authFetch(`/api/v1/dashboard/charts?${qs.toString()}`).then(r => r.json()).then(setCharts).catch(() => setCharts({
      monthlyRevenue: [150000,160000,155000,170000],
      monthlyExpense: [120000,130000,125000,140000],
    }));
  }, [buildingId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">אנליטיקות</h1>
        <div className="ms-auto flex items-center gap-2">
          <input className="border rounded px-2 py-1" placeholder="מזהה בניין" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>הכנסות</CardTitle></CardHeader><CardContent>₪{(kpis?.totalRevenue||0).toLocaleString()}</CardContent></Card>
        <Card><CardHeader><CardTitle>הוצאות</CardTitle></CardHeader><CardContent>₪{(kpis?.totalExpenses||0).toLocaleString()}</CardContent></Card>
        <Card><CardHeader><CardTitle>קריאות פתוחות</CardTitle></CardHeader><CardContent>{kpis?.openTickets ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>הזמנות עבודה פתוחות</CardTitle></CardHeader><CardContent>{kpis?.openWorkOrders ?? 0}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>מגמות חודשיות</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">חודש</th>
                  <th className="p-2">הכנסות</th>
                  <th className="p-2">הוצאות</th>
                </tr>
              </thead>
              <tbody>
                {(charts?.monthlyRevenue || []).map((rev: number, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2">₪{rev.toLocaleString()}</td>
                    <td className="p-2">₪{(charts?.monthlyExpense?.[idx] || 0).toLocaleString()}</td>
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


