import { expect, test, type Page } from '@playwright/test';
import { configureClient, mockApi, setSession, type SessionRole } from './support/app-fixtures';

async function setupRole(page: Page, role: SessionRole) {
  await setSession(page, role);
  await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
  await mockApi(page);
}

test.describe('sprint 7 — role × top-task E2E matrix', () => {
  test.describe.configure({ timeout: 60_000 });

  test.describe('PM role tasks', () => {
    test('PM can view dashboard and attention items', async ({ page }) => {
      await setupRole(page, 'PM');
      await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('פעולה ראשית').first()).toBeVisible();
      await expect(page.getByText(/קריאות פתוחות|open tickets/i).first()).toBeVisible();
    });

    test('PM can navigate to tickets and see triage queue', async ({ page }) => {
      await setupRole(page, 'PM');
      await page.goto('/tickets', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('נזילה בלובי').first()).toBeVisible();
      await expect(page.getByText(/דחוף|URGENT/i).first()).toBeVisible();
    });

    test('PM can open ticket detail and view comments', async ({ page }) => {
      await setupRole(page, 'PM');
      await page.goto('/tickets/101', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: 'קריאה #101' })).toBeVisible();
      await expect(page.getByText('נפתח לטיפול').first()).toBeVisible();
    });

    test('PM can view buildings list', async ({ page }) => {
      await setupRole(page, 'PM');
      await page.goto('/buildings', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
      await expect(page.getByText('מגדל העיר').first()).toBeVisible();
      await expect(page.getByText('נוף הגן').first()).toBeVisible();
    });

    test('PM can view finance reports', async ({ page }) => {
      await setupRole(page, 'PM');
      await page.goto('/finance/reports', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: 'דוחות פיננסיים' })).toBeVisible();
      await expect(page.getByText('סה״כ הכנסות').first()).toBeVisible();
    });

    test('PM can view maintenance schedules', async ({ page }) => {
      await setupRole(page, 'PM');
      await page.goto('/maintenance', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: 'תחזוקה ותפעול' })).toBeVisible();
      await expect(page.getByText('בדיקת משאבות').first()).toBeVisible();
    });

    test('PM can access settings and view profile', async ({ page }) => {
      await setupRole(page, 'PM');
      await page.goto('/settings', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: 'הגדרות משתמש' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /אימייל/ })).toBeVisible();
    });

    test('PM can access payments page', async ({ page }) => {
      await setupRole(page, 'PM');
      await page.goto('/payments', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText(/תשלומים/).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'סליקה' })).toBeVisible();
    });
  });

  test.describe('ADMIN role tasks', () => {
    test('ADMIN reaches role selection on login', async ({ page }) => {
      await setupRole(page, 'ADMIN');
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      await expect(page).toHaveURL(/\/role-selection$/);
      await expect(page.getByRole('button', { name: /כניסה למערכת הניהול|open ams workspace|continue to ams/i }).first()).toBeVisible();
    });

    test('ADMIN can enter AMS workspace and view dashboard', async ({ page }) => {
      await setupRole(page, 'ADMIN');
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      await page.getByRole('button', { name: /כניסה למערכת הניהול|open ams workspace|continue to ams/i }).first().click();
      await expect(page).toHaveURL(/\/home$/);
    });

    test('ADMIN can enter gardens workspace', async ({ page }) => {
      await setupRole(page, 'ADMIN');
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      await page.getByRole('button', { name: /כניסה לניהול גינון|open gardens workspace|gardens/i }).first().click();
      await expect(page).toHaveURL(/\/gardens$/);
      await expect(page.getByRole('heading', { name: /ניהול גננים|gardens/i }).first()).toBeVisible();
    });

    test('ADMIN can view buildings list', async ({ page }) => {
      await setupRole(page, 'ADMIN');
      await page.goto('/buildings', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
    });
  });

  test.describe('TECH role tasks', () => {
    test('TECH reaches role selection on login', async ({ page }) => {
      await setupRole(page, 'TECH');
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      await expect(page).toHaveURL(/\/role-selection$/);
    });

    test('TECH can access gardens worker dashboard', async ({ page }) => {
      await setupRole(page, 'TECH');
      await page.goto('/gardens', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: /נדרשים תיקונים לפני אישור|המשך לעדכן את החודש הפעיל/ })).toBeVisible();
    });

    test('TECH can view their assignments', async ({ page }) => {
      await setupRole(page, 'TECH');
      await page.goto('/gardens', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText(/שדרות האורן|הרצל/).first()).toBeVisible();
    });
  });

  test.describe('RESIDENT role tasks', () => {
    test('RESIDENT is routed directly to account page', async ({ page }) => {
      await setupRole(page, 'RESIDENT');
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      await expect(page).toHaveURL(/\/resident\/account$/);
    });

    test('RESIDENT can view their building info', async ({ page }) => {
      await setupRole(page, 'RESIDENT');
      await page.goto('/resident/account', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('link', { name: /הבניין שלי|my building/i }).first()).toBeVisible();
    });

    test('RESIDENT can view payment center', async ({ page }) => {
      await setupRole(page, 'RESIDENT');
      await page.goto('/payments/resident', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: 'מרכז תשלומים' })).toBeVisible();
      await expect(page.getByText('מסלול תשלום מהיר')).toBeVisible();
    });

    test('RESIDENT can access requests page', async ({ page }) => {
      await setupRole(page, 'RESIDENT');
      await page.goto('/resident/requests', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText(/בקשת דייר חדשה|בקשות דייר/).first()).toBeVisible();
    });

    test('RESIDENT can view votes', async ({ page }) => {
      await setupRole(page, 'RESIDENT');
      await page.goto('/votes', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: 'הצבעות בניין' })).toBeVisible();
    });

    test('RESIDENT can view notifications', async ({ page }) => {
      await setupRole(page, 'RESIDENT');
      await page.goto('/notifications', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText(/התראות|Notifications/i).first()).toBeVisible();
    });
  });

  test.describe('MASTER role tasks', () => {
    test('MASTER reaches role selection on login', async ({ page }) => {
      await setupRole(page, 'MASTER');
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      await expect(page).toHaveURL(/\/role-selection$/);
    });

    test('MASTER can access AMS workspace', async ({ page }) => {
      await setupRole(page, 'MASTER');
      await page.goto('/home', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText(/מרכז העבודה|תיבת מנהל נכס/).first()).toBeVisible();
    });
  });
});
