import React from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Card, Button, Badge } from './UI';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const EXPENSE_DATA = [
  { name: 'Maintenance', value: 4500, color: '#D4AF37' },
  { name: 'Utilities', value: 3200, color: '#141414' },
  { name: 'Staff', value: 8900, color: '#737373' },
  { name: 'Marketing', value: 1200, color: '#E5E5E5' },
];

const RECENT_INVOICES = [
  { id: '1', title: 'Elevator Service Co.', amount: 1200, type: 'Expense', status: 'Pending' },
  { id: '2', title: 'Unit 402 Rent', amount: 2450, type: 'Income', status: 'Received' },
  { id: '3', title: 'City Water Dept.', amount: 450, type: 'Expense', status: 'Paid' },
];

export const AccountantView = () => {
  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Financials</h1>
          <p className="text-neutral-500 text-sm">Real-time cashflow tracking</p>
        </div>
        <Button variant="outline" size="icon">
          <Download className="w-5 h-5" />
        </Button>
      </header>

      {/* Cashflow Cards */}
      <section className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-2 bg-emerald-50 border-emerald-100">
          <div className="flex justify-between items-start">
            <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">Income</div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">$242.8k</div>
          <div className="text-[10px] text-emerald-600 font-bold">+8.4% vs last month</div>
        </Card>
        <Card className="p-4 space-y-2 bg-rose-50 border-rose-100">
          <div className="flex justify-between items-start">
            <div className="text-rose-600 text-[10px] font-bold uppercase tracking-widest">Expenses</div>
            <ArrowDownLeft className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900">$118.2k</div>
          <div className="text-[10px] text-rose-600 font-bold">+2.1% vs last month</div>
        </Card>
      </section>

      {/* Expense Breakdown */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Expense Breakdown</h2>
          <PieChartIcon className="w-4 h-4 text-neutral-400" />
        </div>
        <Card className="p-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={EXPENSE_DATA} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={80} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {EXPENSE_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Recent Invoices */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Recent Invoices</h2>
          <Button variant="ghost" size="sm" className="text-neutral-500">Filter</Button>
        </div>
        <div className="space-y-3">
          {RECENT_INVOICES.map((inv) => (
            <Card key={inv.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  inv.type === 'Income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                )}>
                  {inv.type === 'Income' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </div>
                <div>
                  <div className="font-semibold text-sm">{inv.title}</div>
                  <div className="text-xs text-neutral-400">{inv.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">${inv.amount}</div>
                <Badge variant={inv.status === 'Received' || inv.status === 'Paid' ? 'success' : 'warning'}>
                  {inv.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

import { cn } from '@/src/lib/utils';
