import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, mockApi, setSession } from './support/app-fixtures';

test.describe('mobile support smoke', () => {
  test.describe.configure({ timeout: 60_000, mode: 'serial' });

  test('mobile shell drawer opens and navigates to buildings', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/home');
    const sidebarDialog = page.getByRole('dialog').filter({ has: page.getByRole('navigation').first() });
    if (!(await sidebarDialog.isVisible().catch(() => false))) {
      await page.locator('header button').first().click({ force: true });
    }
    const buildingsLink = sidebarDialog.getByRole('link', { name: /בניינים/ }).first();
    await expect(buildingsLink).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/buildings$/),
      buildingsLink.click({ force: true }),
    ]);
    await expect(page).toHaveURL(/\/buildings$/);
    await expect(page.getByRole('banner').getByText('בניינים ונכסים')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('buildings page uses mobile cards without overflow', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/buildings');
    await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'צפה' }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('payments page keeps critical finance actions reachable on mobile', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/payments');
    await expect(page.getByRole('heading', { name: 'תשלומים', exact: true })).toBeVisible();
    await expect(page.getByText('#5001 · ועד בית מרץ')).toBeVisible();
    await expect(page.getByRole('button', { name: 'סליקה' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'צור חשבונית' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('resident account renders mobile summary and payment section', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'RESIDENT');

    await page.goto('/resident/account');
    await expect(page.getByText(/דופק החשבון/i).first()).toBeVisible();
    await expect(page.getByText(/שלם עכשיו|Pay now/i).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('resident payment lane keeps one clear next action and secure handoff', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'RESIDENT');

    await page.goto('/payments/resident');
    await expect(page.getByText('מסלול תשלום מהיר')).toBeVisible();
    await expect(page.getByRole('button', { name: 'תשלום מיידי' })).toBeVisible();
    await page.getByRole('button', { name: 'תשלום מיידי' }).click();
    await expect(page.getByRole('heading', { name: 'תשלום מאובטח' })).toBeVisible();
    await expect(page.getByText('לפני שעוברים למסלול המאובטח')).toBeVisible();
    await page.getByRole('button', { name: 'המשך לאישור תשלום' }).click();
    await page.getByRole('button', { name: 'אישור ותשלום' }).click();
    await expect(page.getByRole('button', { name: 'המשך למסלול המאובטח' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('resident add-card flow shows inline validation on mobile', async ({ page }) => {
    await mockApi(page, { residentPaymentMethods: [] });
    await setSession(page, 'RESIDENT');

    await page.goto('/payments/resident?section=methods');
    await expect(page.getByRole('tab', { name: /כרטיסים/ })).toBeVisible();
    await page.getByRole('tab', { name: /כרטיסים/ }).click();
    await page.getByRole('button', { name: 'הוסף כרטיס' }).click();
    await expect(page.getByRole('heading', { name: 'הוספת כרטיס חדש' })).toBeVisible();
    await page.getByRole('button', { name: 'המשך לאישור' }).click();
    await expect(page.getByText('יש למלא שם בעל הכרטיס.')).toBeVisible();
    await expect(page.getByText('מספר הכרטיס אינו מלא.')).toBeVisible();
    await expect(page.getByText('יש להזין תוקף בפורמט MM/YY.')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('resident bottom navigation more drawer opens and routes to building details', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'RESIDENT');

    await page.goto('/resident/account');
    await page.getByRole('button', { name: /עוד|more/i }).click({ force: true });
    await expect(page.getByRole('link', { name: /הבניין שלי/ })).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/resident\/building$/),
      page.getByRole('link', { name: /הבניין שלי/ }).click(),
    ]);
    await expect(page).toHaveURL(/\/resident\/building$/);
    await expectNoHorizontalOverflow(page);
  });

  test('gardens manager and worker mobile surfaces render without overflow', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/gardens');
    await expect(page.getByText('מודול הגינון').first()).toBeVisible();
    await expect(page.getByText('מרכז עבודה').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await setSession(page, 'TECH');
    await page.goto('/gardens');
    await expect(page.getByText(/נדרשים תיקונים לפני אישור|המשך לעדכן את החודש הפעיל/).first()).toBeVisible();
    await expect(page.getByText(/המשך לערוך או הגש לאישור|החודש סגור לעריכה/).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('worker mobile navigation exposes jobs, gardens, supervision, and management', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'TECH');

    await page.goto('/tech/jobs');
    await expect(page.getByRole('heading', { name: 'כלי שטח' })).toBeVisible();
    await expect(page.getByRole('link', { name: /דוח פיקוח/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^גינון/ }).last()).toBeVisible();
    await expect(page.getByRole('link', { name: /עדכון סטטוס/ }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('master mobile shell is populated and routes are reachable', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'MASTER');

    await page.goto('/home');
    const sidebarDialog = page.getByRole('dialog').filter({ has: page.getByRole('navigation').first() });
    if (!(await sidebarDialog.isVisible().catch(() => false))) {
      await page.locator('header button').first().click({ force: true });
    }

    await expect(sidebarDialog.getByRole('link', { name: /בית/ }).first()).toBeVisible();
    await expect(sidebarDialog.getByRole('link', { name: /בקשות/ }).first()).toBeVisible();
    await expect(sidebarDialog.getByRole('link', { name: /דוח פיקוח/ }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
