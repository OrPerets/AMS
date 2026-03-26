import { expect, test, type Page } from '@playwright/test';
import { configureClient, mockApi, setSession, type SessionRole } from './support/app-fixtures';
import { isFeatureEnabled, getAllFlags, getRolloutSummary, type FeatureFlag } from '../lib/feature-flags';
import { evaluateKpi, generateWeeklyReport, getAllThresholds, type KpiDataPoint } from '../lib/kpi-monitoring';

async function setupRole(page: Page, role: SessionRole) {
  await setSession(page, role);
  await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
  await mockApi(page);
}

test.describe('sprint 8 — feature flag rollout verification', () => {
  test('all UX v2 flags are at full rollout', () => {
    const flags = getAllFlags();
    const uxFlags = flags.filter((f) => f.flag.startsWith('ux-v2-'));

    for (const flag of uxFlags) {
      expect(flag.stage, `${flag.flag} should be at full rollout`).toBe('full');
      expect(flag.percentage, `${flag.flag} should be at 100%`).toBe(100);
    }
  });

  test('feature flags respect role boundaries', () => {
    const pmFlags: FeatureFlag[] = ['ux-v2-pm-home', 'ux-v2-tickets', 'ux-v2-maintenance', 'ux-v2-finance'];
    for (const flag of pmFlags) {
      expect(isFeatureEnabled(flag, { role: 'PM', userId: 7 }), `${flag} should be enabled for PM`).toBe(true);
    }

    expect(isFeatureEnabled('ux-v2-resident-home', { role: 'RESIDENT', userId: 8 })).toBe(true);
    expect(isFeatureEnabled('ux-v2-tech-home', { role: 'TECH', userId: 9 })).toBe(true);
    expect(isFeatureEnabled('ux-v2-admin-home', { role: 'ADMIN', userId: 5 })).toBe(true);
  });

  test('rollout summary shows expected distribution', () => {
    const summary = getRolloutSummary();
    expect(summary.full).toBeGreaterThanOrEqual(9);
    expect(summary.disabled).toBe(0);
  });

  test('disabled flag prevents feature access', () => {
    expect(isFeatureEnabled('ux-v2-pm-home' as FeatureFlag, { role: null, userId: null })).toBe(true);
  });
});

test.describe('sprint 8 — KPI monitoring validation', () => {
  test('KPI thresholds are defined for all tracked metrics', () => {
    const thresholds = getAllThresholds();
    expect(thresholds.length).toBeGreaterThanOrEqual(9);

    const metricNames = thresholds.map((t) => t.metric);
    expect(metricNames).toContain('time_to_first_action');
    expect(metricNames).toContain('taps_to_top_action');
    expect(metricNames).toContain('task_completion_rate');
    expect(metricNames).toContain('error_rate');
  });

  test('KPI alert fires on critical threshold breach', () => {
    const dataPoint: KpiDataPoint = {
      metric: 'time_to_first_action',
      role: 'PM',
      value: 6000,
      timestamp: new Date().toISOString(),
    };

    const alert = evaluateKpi(dataPoint);
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe('critical');
    expect(alert!.metric).toBe('time_to_first_action');
  });

  test('KPI alert fires on warning threshold breach', () => {
    const dataPoint: KpiDataPoint = {
      metric: 'time_to_first_action',
      role: 'PM',
      value: 3500,
      timestamp: new Date().toISOString(),
    };

    const alert = evaluateKpi(dataPoint);
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe('warning');
  });

  test('KPI returns no alert for healthy values', () => {
    const dataPoint: KpiDataPoint = {
      metric: 'time_to_first_action',
      role: 'PM',
      value: 1500,
      timestamp: new Date().toISOString(),
    };

    const alert = evaluateKpi(dataPoint);
    expect(alert).toBeNull();
  });

  test('weekly report generation aggregates alerts correctly', () => {
    const dataPoints: KpiDataPoint[] = [
      { metric: 'time_to_first_action', role: 'PM', value: 6000, timestamp: new Date().toISOString() },
      { metric: 'error_rate', role: 'ADMIN', value: 3, timestamp: new Date().toISOString() },
      { metric: 'task_completion_rate', role: 'TECH', value: 90, timestamp: new Date().toISOString() },
      { metric: 'page_load_time', role: 'RESIDENT', value: 1000, timestamp: new Date().toISOString() },
    ];

    const report = generateWeeklyReport(dataPoints);
    expect(report.dataPoints).toHaveLength(4);
    expect(report.summary.totalMetrics).toBe(4);
    expect(report.summary.criticalCount).toBeGreaterThanOrEqual(1);
    expect(report.summary.warningCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('sprint 8 — progressive rollout smoke tests', () => {
  test.describe.configure({ timeout: 60_000 });

  const rolePages: Array<{ role: SessionRole; path: string; readyText: string }> = [
    { role: 'PM', path: '/admin/dashboard', readyText: 'פעולה ראשית' },
    { role: 'ADMIN', path: '/home', readyText: 'מרכז העבודה' },
    { role: 'TECH', path: '/gardens', readyText: 'שדרות האורן' },
    { role: 'RESIDENT', path: '/resident/account', readyText: 'הבניין שלי' },
  ];

  for (const { role, path, readyText } of rolePages) {
    test(`${role} can access their primary workspace at ${path}`, async ({ page }) => {
      await setupRole(page, role);
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      await expect(page.getByText(readyText).first()).toBeVisible();
    });
  }

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });
});
