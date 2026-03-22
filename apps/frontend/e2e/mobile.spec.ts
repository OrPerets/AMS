import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, mockApi, setSession } from './support/app-fixtures';

test.describe('mobile support smoke', () => {
  test('mobile shell drawer opens and navigates to buildings', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/home');
    const sidebarDialog = page.getByRole('dialog').filter({ has: page.getByRole('navigation').first() });
    if (!(await sidebarDialog.isVisible().catch(() => false))) {
      await page.locator('header button').first().click({ force: true });
    }
    const buildingsLink = sidebarDialog.getByRole('link', { name: /בניינים ויחידות/ }).first();
    await expect(buildingsLink).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/buildings$/),
      buildingsLink.click({ force: true }),
    ]);
    await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
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
    await expect(page.getByText(/חיוב אוטומטי/).first()).toBeVisible();
    await expect(page.getByText('שלם').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('gardens manager and worker mobile surfaces render without overflow', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/gardens');
    await expect(page.getByRole('heading', { name: 'ניהול גננים' })).toBeVisible();
    await expect(page.getByText('מרכז עבודה').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await setSession(page, 'TECH');
    await page.goto('/gardens');
    await expect(page.getByRole('heading', { name: /שלום/ })).toBeVisible();
    await expect(page.getByText('שמור או הגש את החודש').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
