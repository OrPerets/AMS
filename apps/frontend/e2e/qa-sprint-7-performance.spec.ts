import { expect, test, type Page } from '@playwright/test';
import { configureClient, mockApi, setSession, type SessionRole } from './support/app-fixtures';

async function setupRole(page: Page, role: SessionRole) {
  await setSession(page, role);
  await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
  await mockApi(page);
}

const BUDGET_FIRST_PAINT_MS = 3000;
const BUDGET_INTERACTION_MS = 5000;
const BUDGET_DOM_NODES = 3000;
const BUDGET_JS_HEAP_MB = 50;

interface PerfTarget {
  role: SessionRole;
  path: string;
  readySelector: string;
  label: string;
}

const perfTargets: PerfTarget[] = [
  { role: 'PM', path: '/admin/dashboard', readySelector: 'text=פעולה ראשית', label: 'pm-dashboard' },
  { role: 'PM', path: '/tickets', readySelector: 'text=נזילה בלובי', label: 'pm-tickets' },
  { role: 'PM', path: '/buildings', readySelector: 'heading:has-text("ניהול בניינים")', label: 'pm-buildings' },
  { role: 'RESIDENT', path: '/resident/account', readySelector: 'text=הבניין שלי', label: 'resident-account' },
  { role: 'RESIDENT', path: '/payments/resident', readySelector: 'heading:has-text("מרכז תשלומים")', label: 'resident-payments' },
  { role: 'TECH', path: '/gardens', readySelector: 'text=שדרות האורן', label: 'tech-gardens' },
];

test.describe('sprint 7 — performance budget checks', () => {
  test.describe.configure({ timeout: 60_000 });

  for (const target of perfTargets) {
    test(`perf budget: ${target.label} first-paint and interaction`, async ({ page }) => {
      await setupRole(page, target.role);

      const navigationStart = Date.now();
      await page.goto(target.path, { waitUntil: 'domcontentloaded' });

      const readyElement = page.locator(target.readySelector).first();
      await expect(readyElement).toBeVisible({ timeout: 15_000 });
      const interactionReady = Date.now();

      const performanceTiming = await page.evaluate(() => {
        const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (entries.length > 0) {
          return {
            domContentLoaded: entries[0].domContentLoadedEventEnd,
            loadComplete: entries[0].loadEventEnd,
            firstByte: entries[0].responseStart,
          };
        }
        return null;
      });

      if (performanceTiming) {
        expect(
          performanceTiming.domContentLoaded,
          `${target.label}: DOMContentLoaded (${performanceTiming.domContentLoaded.toFixed(0)}ms) exceeds budget (${BUDGET_FIRST_PAINT_MS}ms)`,
        ).toBeLessThan(BUDGET_FIRST_PAINT_MS);
      }

      const timeToInteraction = interactionReady - navigationStart;
      expect(
        timeToInteraction,
        `${target.label}: time-to-interaction (${timeToInteraction}ms) exceeds budget (${BUDGET_INTERACTION_MS}ms)`,
      ).toBeLessThan(BUDGET_INTERACTION_MS);
    });

    test(`perf budget: ${target.label} DOM complexity`, async ({ page }) => {
      await setupRole(page, target.role);
      await page.goto(target.path, { waitUntil: 'domcontentloaded' });

      const readyElement = page.locator(target.readySelector).first();
      await expect(readyElement).toBeVisible({ timeout: 15_000 });

      const domNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
      expect(
        domNodeCount,
        `${target.label}: DOM node count (${domNodeCount}) exceeds budget (${BUDGET_DOM_NODES})`,
      ).toBeLessThan(BUDGET_DOM_NODES);
    });
  }

  test('perf budget: JS heap size on PM dashboard', async ({ page, context }) => {
    const cdpSession = await context.newCDPSession(page);
    await setupRole(page, 'PM');
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('פעולה ראשית').first()).toBeVisible();

    const heapInfo = await cdpSession.send('Runtime.getHeapUsage');
    const usedHeapMb = heapInfo.usedSize / (1024 * 1024);

    expect(
      usedHeapMb,
      `JS heap (${usedHeapMb.toFixed(1)}MB) exceeds budget (${BUDGET_JS_HEAP_MB}MB)`,
    ).toBeLessThan(BUDGET_JS_HEAP_MB);
  });

  test('no excessive network requests on resident account load', async ({ page }) => {
    await setupRole(page, 'RESIDENT');

    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/')) {
        requests.push(req.url());
      }
    });

    await page.goto('/resident/account', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /הבניין שלי/ }).first()).toBeVisible();

    expect(
      requests.length,
      `Resident account made ${requests.length} API calls (limit: 15)`,
    ).toBeLessThanOrEqual(15);
  });
});
