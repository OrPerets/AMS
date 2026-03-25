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
    await expect(page.getByText('יתרה לתשלום')).toBeVisible();
    await expect(page.getByRole('button', { name: /שלם עכשיו|חזרה לחשבון/ }).first()).toBeVisible();
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

    await expect(page.getByText('לפני שליחה')).toBeVisible();
    await expect(page.getByText('צפי טיפול', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /שלח בקשה|אישור ושליחה/ }).click();
    await page.waitForURL(/\/resident\/requests\?view=history/);
    await expect(page.getByText('בקשה לאישור חניה').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('resident can add a card from the mobile payment methods flow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setSession(page, 'RESIDENT');
    await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
    await mockApi(page, { residentPaymentMethods: [], residentAutopayEnabled: false });

    await page.goto('/resident/payment-methods?addCard=1', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('כרטיס חדש למסלול התשלום')).toBeVisible();

    await page.getByLabel('שם בעל הכרטיס').fill('Or Peretz');
    await page.getByLabel('מספר כרטיס').fill('4242 4242 4242 4242');
    await page.getByLabel('תוקף').fill('12/28');
    await page.getByRole('button', { name: 'המשך לאישור' }).click();

    await expect(page.getByText('ויזה •••• 4242')).toBeVisible();
    await page.getByRole('button', { name: 'אישור ושמירת כרטיס' }).click();
    await expect(page.getByText('כרטיס ראשי')).toBeVisible();
    await expect(page.getByText('ויזה •••• 4242').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('resident can promote a secondary card and removing the default falls back cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setSession(page, 'RESIDENT');
    await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
    await mockApi(page, {
      residentPaymentMethods: [
        { id: 1, provider: 'tranzila', brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2028, isDefault: true, networkTokenized: true },
        { id: 2, provider: 'tranzila', brand: 'Mastercard', last4: '9898', expMonth: 11, expYear: 2029, isDefault: false, networkTokenized: true },
      ],
    });

    await page.goto('/resident/payment-methods', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('מאסטרקארד •••• 9898')).toBeVisible();

    await page.getByRole('button', { name: 'קבע כברירת מחדל' }).click();
    await expect(page.getByText('מאסטרקארד •••• 9898').first()).toBeVisible();
    await expect(page.getByText('פעיל לתשלום')).toBeVisible();

    await page
      .locator('div.rounded-\\[26px\\]')
      .filter({ hasText: 'מאסטרקארד •••• 9898' })
      .getByRole('button', { name: 'הסר' })
      .click();
    await expect(page.getByText('מאסטרקארד •••• 9898')).toHaveCount(0);
    await expect(page.getByText('ויזה •••• 4242').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('resident payment flow without a saved card routes into add-card flow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setSession(page, 'RESIDENT');
    await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
    await mockApi(page, { residentPaymentMethods: [], residentAutopayEnabled: false });

    await page.goto('/payments/resident', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /ועד בית מרץ/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'הוסף כרטיס ראשי' }).click();

    await page.waitForURL(/\/resident\/payment-methods/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('כרטיס חדש למסלול התשלום')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
