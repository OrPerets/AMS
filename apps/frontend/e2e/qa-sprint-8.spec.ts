import { expect, test, type Page } from '@playwright/test';
import { configureClient, mockApi, setSession } from './support/app-fixtures';

async function gotoRoleSelectionAs(page: Page, role: 'ADMIN' | 'PM') {
  await setSession(page, role);
  await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
  await mockApi(page);
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/role-selection$/);
}

test.describe('sprint 8 qa + rollout hardening smoke', () => {
  test('landing to login funnels correctly and resident is routed to resident account', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('link', { name: /enter the system|כניסה למערכת|enter/i }).first().click();
    await expect(page).toHaveURL(/\/login/);

    await setSession(page, 'RESIDENT');
    await mockApi(page);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/resident\/account$/);
    await expect(page.getByRole('link', { name: /הבניין שלי|my building/i }).first()).toBeVisible();
  });

  test('admin goes through role selection and can enter AMS workspace', async ({ page }) => {
    await gotoRoleSelectionAs(page, 'ADMIN');

    await page.getByRole('button', { name: /כניסה למערכת הניהול|open ams workspace|continue to ams/i }).first().click();
    await expect(page).toHaveURL(/\/home$/);
  });

  test('admin can enter gardens workspace from role selection', async ({ page }) => {
    await gotoRoleSelectionAs(page, 'ADMIN');

    await page.getByRole('button', { name: /כניסה לניהול גינון|open gardens workspace|gardens/i }).first().click();
    await expect(page).toHaveURL(/\/gardens$/);
    await expect(page.getByRole('heading', { name: /ניהול גננים|gardens/i }).first()).toBeVisible();
  });

  test('non-resident can launch external supervision report from role selection', async ({ page, context }) => {
    await gotoRoleSelectionAs(page, 'PM');

    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: /טופס הפיקוח|open supervision report|supervision/i }).first().click();
    const popup = await popupPromise;

    await popup.waitForLoadState('domcontentloaded');
    await expect(popup.url()).toContain('amit-form.vercel.app');
    await popup.close();
  });

  test('direct visit to a protected route redirects unauthenticated users to login with next', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?next=%2Fhome$/);
  });

  test('keyboard-only access keeps role-selection controls reachable', async ({ page }) => {
    await gotoRoleSelectionAs(page, 'PM');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();

    await expect(page.getByRole('switch', { name: /זכור את הבחירה שלי|remember/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /כניסה למערכת הניהול|open ams workspace|continue to ams/i }).first()).toBeVisible();
  });
});
