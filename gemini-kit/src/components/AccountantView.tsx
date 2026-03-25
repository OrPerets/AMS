import React from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart as PieChartIcon,
  Search,
  FileText,
  DollarSign
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
import { cn } from '@/src/lib/utils';

const EXPENSE_DATA = [
  { name: 'Maintenance', value: 4500, color: '#D4AF37' },
  { name: 'Utilities', value: 3200, color: '#141414' },
  { name: 'Staffing', value: 8900, color: '#737373' },
  { name: 'Marketing', value: 1200, color: '#E5E5E5' },
];

const RECENT_INVOICES = [
  { id: '1', title: 'Elevator Service Co.', amount: 1200, type: 'Expense', status: 'Pending', date: 'Mar 24' },
  { id: '2', title: 'Unit 402 Rent', amount: 2450, type: 'Income', status: 'Received', date: 'Mar 23' },
  { id: '3', title: 'City Water Dept.', amount: 450, type: 'Expense', status: 'Paid', date: 'Mar 22' },
];

export const AccountantView = () => {
  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Financials</h1>
          <p className="text-neutral-500 text-sm">Real-time cashflow tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="rounded-xl">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Cashflow Cards */}
      <section className="grid grid-cols-2 gap-4">
        <Card className="p-5 space-y-3 bg-white border-neutral-100 shadow-xl shadow-neutral-900/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full" />
          <div className="flex justify-between items-start">
            <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">Income</div>
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900">$242.8k</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +8.4% vs last month
            </div>
          </div>
        </Card>
        <Card className="p-5 space-y-3 bg-white border-neutral-100 shadow-xl shadow-neutral-900/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full" />
          <div className="flex justify-between items-start">
            <div className="text-rose-600 text-[10px] font-bold uppercase tracking-widest">Expenses</div>
            <div className="p-1.5 bg-rose-50 rounded-lg">
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900">$118.2k</div>
            <div className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              +2.1% vs last month
            </div>
          </div>
        </Card>
      </section>

      {/* Expense Breakdown */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Expense Allocation</h2>
          <Button variant="ghost" size="sm" className="text-gold font-bold text-[10px] uppercase tracking-wider">Reports</Button>
        </div>
        <Card className="p-6 h-56 bg-white border-neutral-100 shadow-xl shadow-neutral-900/5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={EXPENSE_DATA} layout="vertical" margin={{ left: -20, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#737373' }} 
                width={80} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
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
        <div className="flex justify-between items-end">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Recent Invoices</h2>
          <Button variant="ghost" size="sm" className="text-gold font-bold text-[10px] uppercase tracking-wider">View All</Button>
        </div>
        <div className="space-y-3">
          {RECENT_INVOICES.map((inv) => (
            <Card key={inv.id} className="p-4 flex items-center justify-between group hover:border-gold transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  inv.type === 'Income' ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" : "bg-rose-50 text-rose-600 group-hover:bg-rose-100"
                )}>
                  {inv.type === 'Income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                </div>
                <div>
                  <div className="font-bold text-sm text-neutral-900">{inv.title}</div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{inv.date} • {inv.type}</div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="font-bold text-sm text-neutral-900">${inv.amount.toLocaleString()}</div>
                <Badge 
                  variant={inv.status === 'Received' || inv.status === 'Paid' ? 'success' : 'warning'}
                  className="text-[9px] px-1.5 py-0"
                >
                  {inv.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Financial Actions */}
      <section className="grid grid-cols-3 gap-3">
        <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl bg-white border-neutral-100">
          <FileText className="w-5 h-5 text-gold" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-600">Tax Docs</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl bg-white border-neutral-100">
          <Calculator className="w-5 h-5 text-gold" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-600">Audit</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2 rounded-2xl bg-white border-neutral-100">
          <DollarSign className="w-5 h-5 text-gold" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-600">Payroll</span>
        </Button>
      </section>
    </div>
  );
};
