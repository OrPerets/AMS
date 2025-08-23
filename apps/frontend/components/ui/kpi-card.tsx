// /Users/orperetz/Documents/AMS/apps/frontend/components/ui/kpi-card.tsx
"use client";

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { cn } from '../../lib/utils';

interface KpiCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  description?: string;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
  badgeText?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  clickable?: boolean;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  description,
  className,
  trend,
  badgeText,
  badgeVariant = 'default',
  clickable = false,
  onClick,
}: KpiCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up' || changeType === 'positive') {
      return <TrendingUp className="h-4 w-4 text-success" />;
    }
    if (trend === 'down' || changeType === 'negative') {
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        clickable && "cursor-pointer hover:shadow-md hover:scale-[1.02]",
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {badgeText && (
            <Badge variant={badgeVariant} className="text-xs">
              {badgeText}
            </Badge>
          )}
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 text-xs", getChangeColor())}>
              {getTrendIcon()}
              <span>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
