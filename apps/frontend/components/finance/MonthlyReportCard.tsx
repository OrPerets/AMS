import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { StatusBadge } from '../ui/status-badge';
import { cn } from '../../lib/utils';

interface MonthlyReportCardProps {
  title: string;
  value: number;
  previousValue?: number;
  currency?: string;
  colorScheme?: 'default' | 'income' | 'expense' | 'balance';
}

export function MonthlyReportCard({
  title,
  value,
  previousValue,
  currency = '₪',
  colorScheme = 'default',
}: MonthlyReportCardProps) {
  const hasPrevious = typeof previousValue === 'number' && (previousValue > 0 || previousValue < 0);
  const changePercentage = hasPrevious ? ((value - previousValue) / previousValue) * 100 : 0;
  const hasChange = typeof previousValue === 'number' && (changePercentage > 0 || changePercentage < 0);
  const isPositive = changePercentage > 0;

  const palette = {
    default: 'text-foreground',
    income: 'text-success',
    expense: 'text-destructive',
    balance: value >= 0 ? 'text-success' : 'text-destructive',
  }[colorScheme];

  const tone = colorScheme === 'expense' ? (isPositive ? 'danger' : 'success') : isPositive ? 'success' : 'danger';
  const TrendIcon = hasChange ? (isPositive ? ArrowUpRight : ArrowDownLeft) : Minus;
  const label = Math.abs(changePercentage).toFixed(1) + '% ' + (isPositive ? 'מעלה' : 'מטה');

  return (
    <Card variant="metric">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <StatusBadge
            label={colorScheme === 'expense' ? 'הוצאה' : colorScheme === 'income' ? 'הכנסה' : 'סיכום'}
            tone={colorScheme === 'expense' ? 'danger' : colorScheme === 'income' ? 'success' : 'finance'}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn('text-3xl font-black', palette)}>
          {currency}
          {value.toLocaleString()}
        </div>
        {hasChange ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StatusBadge label={label} tone={tone} className="text-[11px]" />
            <span className="inline-flex items-center gap-1.5">
              <TrendIcon className="h-4 w-4" />
              לעומת התקופה הקודמת
            </span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">אין שינוי מהתקופה הקודמת</div>
        )}
      </CardContent>
    </Card>
  );
}
