import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, mockApi, setSession } from './support/app-fixtures';

test.describe('mobile support smoke', () => {
  test('mobile shell drawer opens and navigates to buildings', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/home');
    await page.getByRole('button', { name: 'פתח תפריט' }).click({ force: true });
    const buildingsLink = page.locator('a[href="/buildings"]').filter({ hasText: 'בניינים ויחידות' }).first();
    await expect(buildingsLink).toBeVisible();
    await buildingsLink.click();
    await expect(page).toHaveURL(/\/buildings$/);
    await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('buildings page uses mobile cards without overflow', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/buildings');
    await expect(page.getByText('מגדל העיר', { exact: true })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'האזור האישי של הדייר' })).toBeVisible();
    await expect(page.getByText('ועד בית מרץ', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'שלם עכשיו' }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
