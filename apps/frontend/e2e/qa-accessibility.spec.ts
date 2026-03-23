import { expect, test } from '@playwright/test';
import { configureClient, mockApi, setSession } from './support/app-fixtures';

test.describe('sprint 10 accessibility and interaction checks', () => {
  test('login exposes labeled controls and submit action', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('כניסה למערכת')).toBeVisible();
    await expect(page.getByLabel('כתובת אימייל')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'התחבר' })).toBeVisible();
  });

  test('shell exposes skip link and command palette dialog via keyboard', async ({ page }) => {
    await setSession(page, 'PM');
    await mockApi(page);
    await page.goto('/buildings');

    await expect(page.getByRole('link', { name: 'דלג לתוכן הראשי' })).toHaveAttribute('href', '#main-content');

    await page.keyboard.press('Control+K');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'לוח פקודות' })).toBeVisible();
    await expect(page.getByPlaceholder('חפש קריאה, בניין או תצוגה...')).toBeVisible();
  });

  test('rtl and dark-mode parity hold on a critical workflow', async ({ page }) => {
    await setSession(page, 'PM');
    await configureClient(page, { direction: 'rtl', theme: 'dark', locale: 'he' });
    await mockApi(page);
    await page.goto('/finance/reports');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('heading', { name: 'דוחות פיננסיים' })).toBeVisible();
  });

  test('forms, tables, and toggle controls remain reachable', async ({ page }) => {
    await setSession(page, 'PM');
    await mockApi(page);
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: 'הגדרות משתמש' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /אימייל/ })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'טלפון' })).toBeVisible();
    await expect(page.getByRole('button', { name: /שמור פרופיל|Save profile/i })).toBeVisible();

    await page.goto('/buildings');
    await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'צפה' }).first()).toBeVisible();
  });
});
