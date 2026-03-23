import { expect, test } from '@playwright/test';
import { captureEvidence, configureClient, mockApi, setSession } from './support/app-fixtures';

test.describe('sprint 10 tier-1 visual smoke', () => {
  test('captures login surface without demo-prefilled credentials', async ({ page }, testInfo) => {
    await page.goto('/login');

    await expect(page.getByText('כניסה למערכת')).toBeVisible();
    await expect(page.locator('#email')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'התחבר' })).toBeVisible();
    await captureEvidence(page, testInfo, 'tier1-login.png');
  });

  test('captures authenticated tier-1 pages across resident and manager journeys', async ({ page }, testInfo) => {
    const pageChecks = [
      { path: '/resident/account', role: 'RESIDENT' as const, readyRole: 'resident-account-building-link' as const, screenshot: 'tier1-resident-account.png' },
      { path: '/resident/requests', role: 'RESIDENT' as const, readyText: 'בחר סוג בקשה', screenshot: 'tier1-resident-requests.png' },
      { path: '/tickets', role: 'PM' as const, readyHeading: 'נזילה בלובי', screenshot: 'tier1-tickets.png' },
      { path: '/tickets/101', role: 'PM' as const, readyHeading: 'קריאה #101', screenshot: 'tier1-ticket-detail.png' },
      { path: '/buildings', role: 'PM' as const, readyHeading: 'ניהול בניינים', screenshot: 'tier1-buildings.png' },
      { path: '/admin/dashboard', role: 'PM' as const, readyText: 'פעולה ראשית', screenshot: 'tier1-admin-dashboard.png' },
      { path: '/finance/reports', role: 'PM' as const, readyHeading: 'דוחות פיננסיים', screenshot: 'tier1-finance-reports.png' },
      { path: '/votes', role: 'RESIDENT' as const, readyHeading: 'הצבעות בניין', screenshot: 'tier1-votes.png' },
      { path: '/maintenance', role: 'PM' as const, readyHeading: 'תחזוקה ותפעול', screenshot: 'tier1-maintenance.png' },
      { path: '/settings', role: 'PM' as const, readyHeading: 'הגדרות משתמש', screenshot: 'tier1-settings.png' },
    ];

    for (const check of pageChecks) {
      await page.context().clearCookies();
      await setSession(page, check.role);
      await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
      await mockApi(page);
      await page.goto(check.path, { waitUntil: 'domcontentloaded' });

      if (check.readyHeading) {
        await expect(page.getByRole('heading', { name: check.readyHeading })).toBeVisible();
      }

      if (check.readyText) {
        await expect(page.getByText(check.readyText, { exact: true })).toBeVisible();
      }

      if (check.readyRole === 'resident-account-building-link') {
        await expect(page.getByRole('link', { name: /הבניין שלי/ }).first()).toBeVisible();
      }

      await captureEvidence(page, testInfo, check.screenshot);
      await page.unroute('**/api/v1/**');
    }
  });
});
