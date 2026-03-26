import type { AppRole } from '@/shared/domain/roles';

export type KpiMetric =
  | 'time_to_first_action'
  | 'taps_to_top_action'
  | 'abandoned_navigation_rate'
  | 'support_tickets_by_confusion'
  | 'task_completion_rate'
  | 'navigation_churn_rate'
  | 'error_rate'
  | 'page_load_time'
  | 'adoption_rate';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface KpiThreshold {
  metric: KpiMetric;
  warningThreshold: number;
  criticalThreshold: number;
  direction: 'lower_is_better' | 'higher_is_better';
  unit: string;
  description: string;
}

export interface KpiDataPoint {
  metric: KpiMetric;
  role: AppRole;
  value: number;
  timestamp: string;
  page?: string;
}

export interface KpiAlert {
  metric: KpiMetric;
  severity: AlertSeverity;
  role: AppRole;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: string;
}

export interface WeeklyKpiReport {
  weekStarting: string;
  weekEnding: string;
  dataPoints: KpiDataPoint[];
  alerts: KpiAlert[];
  summary: {
    totalMetrics: number;
    warningCount: number;
    criticalCount: number;
    improvementsCount: number;
    regressionsCount: number;
  };
}

const KPI_THRESHOLDS: KpiThreshold[] = [
  {
    metric: 'time_to_first_action',
    warningThreshold: 3000,
    criticalThreshold: 5000,
    direction: 'lower_is_better',
    unit: 'ms',
    description: 'Time from page load to first meaningful action visible',
  },
  {
    metric: 'taps_to_top_action',
    warningThreshold: 3,
    criticalThreshold: 5,
    direction: 'lower_is_better',
    unit: 'taps',
    description: 'Number of taps to reach primary role action',
  },
  {
    metric: 'abandoned_navigation_rate',
    warningThreshold: 15,
    criticalThreshold: 25,
    direction: 'lower_is_better',
    unit: '%',
    description: 'Percentage of sessions with abandoned navigation paths',
  },
  {
    metric: 'support_tickets_by_confusion',
    warningThreshold: 5,
    criticalThreshold: 10,
    direction: 'lower_is_better',
    unit: 'tickets/week',
    description: 'Support tickets attributed to UI confusion per week',
  },
  {
    metric: 'task_completion_rate',
    warningThreshold: 80,
    criticalThreshold: 60,
    direction: 'higher_is_better',
    unit: '%',
    description: 'Percentage of started tasks completed successfully',
  },
  {
    metric: 'navigation_churn_rate',
    warningThreshold: 20,
    criticalThreshold: 35,
    direction: 'lower_is_better',
    unit: '%',
    description: 'Rate of back-and-forth navigation within a session',
  },
  {
    metric: 'error_rate',
    warningThreshold: 2,
    criticalThreshold: 5,
    direction: 'lower_is_better',
    unit: '%',
    description: 'Percentage of page loads resulting in error states',
  },
  {
    metric: 'page_load_time',
    warningThreshold: 2000,
    criticalThreshold: 4000,
    direction: 'lower_is_better',
    unit: 'ms',
    description: 'Median page load time for role home screens',
  },
  {
    metric: 'adoption_rate',
    warningThreshold: 70,
    criticalThreshold: 50,
    direction: 'higher_is_better',
    unit: '%',
    description: 'Percentage of users actively using new UX features',
  },
];

export function getKpiThreshold(metric: KpiMetric): KpiThreshold | undefined {
  return KPI_THRESHOLDS.find((t) => t.metric === metric);
}

export function evaluateKpi(dataPoint: KpiDataPoint): KpiAlert | null {
  const threshold = getKpiThreshold(dataPoint.metric);
  if (!threshold) return null;

  const { value } = dataPoint;
  const isLowerBetter = threshold.direction === 'lower_is_better';

  const isCritical = isLowerBetter
    ? value >= threshold.criticalThreshold
    : value <= threshold.criticalThreshold;

  const isWarning = isLowerBetter
    ? value >= threshold.warningThreshold
    : value <= threshold.warningThreshold;

  if (isCritical) {
    return {
      metric: dataPoint.metric,
      severity: 'critical',
      role: dataPoint.role,
      currentValue: value,
      threshold: threshold.criticalThreshold,
      message: `${threshold.description}: ${value}${threshold.unit} exceeds critical threshold (${threshold.criticalThreshold}${threshold.unit})`,
      timestamp: dataPoint.timestamp,
    };
  }

  if (isWarning) {
    return {
      metric: dataPoint.metric,
      severity: 'warning',
      role: dataPoint.role,
      currentValue: value,
      threshold: threshold.warningThreshold,
      message: `${threshold.description}: ${value}${threshold.unit} exceeds warning threshold (${threshold.warningThreshold}${threshold.unit})`,
      timestamp: dataPoint.timestamp,
    };
  }

  return null;
}

export function generateWeeklyReport(dataPoints: KpiDataPoint[]): WeeklyKpiReport {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const alerts: KpiAlert[] = [];
  for (const dp of dataPoints) {
    const alert = evaluateKpi(dp);
    if (alert) alerts.push(alert);
  }

  return {
    weekStarting: weekStart.toISOString().split('T')[0],
    weekEnding: now.toISOString().split('T')[0],
    dataPoints,
    alerts,
    summary: {
      totalMetrics: dataPoints.length,
      warningCount: alerts.filter((a) => a.severity === 'warning').length,
      criticalCount: alerts.filter((a) => a.severity === 'critical').length,
      improvementsCount: 0,
      regressionsCount: alerts.length,
    },
  };
}

export function getAllThresholds(): KpiThreshold[] {
  return [...KPI_THRESHOLDS];
}
