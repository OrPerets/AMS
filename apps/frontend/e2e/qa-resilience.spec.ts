import { expect, test } from '@playwright/test';
import { mockApi, setSession } from './support/app-fixtures';

test.describe('sprint 10 resilience checks', () => {
  test('admin dashboard recovers after retry from a failing API', async ({ page }) => {
    await setSession(page, 'PM');
    await mockApi(page, { dashboardFailures: 1 });
    await page.goto('/admin/dashboard');

    await expect(page.getByText('מוצגים הנתונים האחרונים שהצליחו להיטען')).toBeVisible();
    await page.getByRole('button', { name: 'נסה שוב' }).click();
    await expect(page.getByRole('heading', { name: 'לוח בקרה ניהולי' })).toBeVisible();
  });

  test('finance reports remain stable under slow responses', async ({ page }) => {
    await setSession(page, 'PM');
    await mockApi(page, { financeDelayMs: 1200 });
    await page.goto('/finance/reports');

    await expect(page.getByRole('heading', { name: 'דוחות פיננסיים' })).toBeVisible();
    await expect(page.getByText('סה״כ הכנסות')).toBeVisible();
  });

  test('settings surface exposes retryable inline error when profile load fails', async ({ page }) => {
    await setSession(page, 'PM');
    await mockApi(page, { settingsFailures: 1 });
    await page.goto('/settings');

    await expect(page.getByText('הגדרות המשתמש לא נטענו')).toBeVisible();
    await page.getByRole('button', { name: 'נסה שוב' }).click();
    await expect(page.getByRole('textbox', { name: /אימייל/ })).toBeVisible();
  });
});
