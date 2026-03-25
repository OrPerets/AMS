import { expect, test } from '@playwright/test';
import { configureClient, expectNoHorizontalOverflow, mockApi, setSession } from './support/app-fixtures';

test.describe('resident flow continuity', () => {
  test.describe.configure({ timeout: 90_000 });

  test('resident hero family stays consistent across account, payments, and profile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setSession(page, 'RESIDENT');
    await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
    await mockApi(page);

    await page.goto('/resident/account', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'האזור האישי' })).toBeVisible();
    await expect(page.getByRole('link', { name: /שלם עכשיו/ }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto('/payments/resident', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'מרכז תשלומים' })).toBeVisible();
    await expect(page.getByRole('button', { name: /תשלום מיידי|חזרה לחשבון/ }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto('/resident/profile', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'הפרופיל שלי' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('resident requests drawer supports the guided 3-step flow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setSession(page, 'RESIDENT');
    await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
    await mockApi(page);

    await page.goto('/resident/requests?view=new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('בחר סוג בקשה')).toBeVisible();

    await page.getByRole('button', { name: /המשך לפרטים/ }).click();
    await expect(page.getByLabel('נושא')).toBeVisible();

    await page.getByLabel('נושא').fill('מעבר לבניין');
    await page.getByLabel('פרטי הבקשה').fill('צריך לתאם כניסה בשעות הבוקר ולעדכן את צוות הבניין.');
    await page.getByLabel('תאריך מבוקש').fill('2026-04-02');

    await page.getByRole('button', { name: 'מעבר לאישור' }).click();
    await expect(page.getByText('לפני שליחה')).toBeVisible();
    await expect(page.getByText('צפי טיפול', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'אישור ושליחה' }).click();
    await expect(page.getByText('הבקשה התקבלה')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
