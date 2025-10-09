import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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
  const changePercentage = previousValue && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : 0;

  const isPositive = changePercentage > 0;
  const hasChange = previousValue !== undefined && changePercentage !== 0;

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'income':
        return 'text-green-700 dark:text-green-400';
      case 'expense':
        return 'text-red-700 dark:text-red-400';
      case 'balance':
        return value >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
      default:
        return 'text-gray-900 dark:text-gray-100';
    }
  };

  const getChangeColor = () => {
    if (colorScheme === 'expense') {
      // For expenses, decrease is good (green), increase is bad (red)
      return isPositive ? 'text-red-600' : 'text-green-600';
    }
    // For income and balance, increase is good
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getColorClasses()}`}>
          {currency}{value.toLocaleString()}
        </div>
        {hasChange && (
          <div className="flex items-center mt-2 text-sm">
            <span className={getChangeColor()}>
              {isPositive ? '▲' : '▼'} {Math.abs(changePercentage).toFixed(1)}%
            </span>
            <span className="text-gray-500 dark:text-gray-400 mr-1">
              לעומת התקופה הקודמת
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

