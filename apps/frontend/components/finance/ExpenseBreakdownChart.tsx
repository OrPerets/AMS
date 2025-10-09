import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ExpenseCategory {
  category: string;
  total: number;
}

interface ExpenseBreakdownChartProps {
  expenses: ExpenseCategory[];
  title?: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: 'תחזוקה',
  UTILITIES: 'חשמל ומים',
  STAFF: 'שכר עובדים',
  ADMINISTRATION: 'ניהול',
  OTHER: 'אחר',
  GENERAL: 'כללי',
  HVAC: 'מיזוג אוויר',
  ELECTRICAL: 'חשמל',
  PLUMBING: 'אינסטלציה',
  SAFETY: 'בטיחות',
  LANDSCAPING: 'גינון',
  ELEVATORS: 'מעליות',
};

export function ExpenseBreakdownChart({ expenses, title = 'פילוח הוצאות' }: ExpenseBreakdownChartProps) {
  const data = expenses.map(exp => ({
    name: CATEGORY_LABELS[exp.category] || exp.category,
    value: exp.total,
    category: exp.category,
  }));

  const total = expenses.reduce((sum, exp) => sum + exp.total, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ₪{data.value.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {((data.value / total) * 100).toFixed(1)}% מסך ההוצאות
          </p>
        </div>
      );
    }
    return null;
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            אין נתוני הוצאות להצגה
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {data.map((item, index) => (
            <div key={item.category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                {item.name}: ₪{item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

