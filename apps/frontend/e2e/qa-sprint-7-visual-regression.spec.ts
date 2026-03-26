import { expect, test, type Page } from '@playwright/test';
import { configureClient, mockApi, setSession, type SessionRole } from './support/app-fixtures';

async function setupRole(page: Page, role: SessionRole, opts?: { theme?: 'light' | 'dark'; direction?: 'rtl' | 'ltr' }) {
  await setSession(page, role);
  await configureClient(page, { direction: opts?.direction ?? 'rtl', theme: opts?.theme ?? 'light', locale: 'he' });
  await mockApi(page);
}

interface SnapshotPage {
  role: SessionRole;
  path: string;
  readySelector: string;
  snapshotName: string;
}

const keyPages: SnapshotPage[] = [
  { role: 'PM', path: '/admin/dashboard', readySelector: 'text=פעולה ראשית', snapshotName: 'pm-dashboard' },
  { role: 'PM', path: '/tickets', readySelector: 'text=נזילה בלובי', snapshotName: 'pm-tickets' },
  { role: 'PM', path: '/buildings', readySelector: 'heading:has-text("ניהול בניינים")', snapshotName: 'pm-buildings' },
  { role: 'PM', path: '/maintenance', readySelector: 'heading:has-text("תחזוקה ותפעול")', snapshotName: 'pm-maintenance' },
  { role: 'PM', path: '/finance/reports', readySelector: 'heading:has-text("דוחות פיננסיים")', snapshotName: 'pm-finance' },
  { role: 'PM', path: '/settings', readySelector: 'heading:has-text("הגדרות משתמש")', snapshotName: 'pm-settings' },
  { role: 'RESIDENT', path: '/resident/account', readySelector: 'text=הבניין שלי', snapshotName: 'resident-account' },
  { role: 'RESIDENT', path: '/payments/resident', readySelector: 'heading:has-text("מרכז תשלומים")', snapshotName: 'resident-payments' },
  { role: 'RESIDENT', path: '/votes', readySelector: 'heading:has-text("הצבעות בניין")', snapshotName: 'resident-votes' },
  { role: 'TECH', path: '/gardens', readySelector: 'text=שדרות האורן', snapshotName: 'tech-gardens' },
  { role: 'ADMIN', path: '/home', readySelector: 'text=מרכז העבודה', snapshotName: 'admin-home' },
];

test.describe('sprint 7 — visual regression snapshots', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const entry of keyPages) {
    test(`visual snapshot: ${entry.snapshotName} (${entry.role})`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await setupRole(page, entry.role);
      await page.goto(entry.path, { waitUntil: 'domcontentloaded' });

      const readyElement = page.locator(entry.readySelector).first();
      await expect(readyElement).toBeVisible({ timeout: 15_000 });

      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`${entry.snapshotName}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });
  }

  test('visual snapshot: login page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('כניסה למערכת')).toBeVisible();

    await expect(page).toHaveScreenshot('login.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});
