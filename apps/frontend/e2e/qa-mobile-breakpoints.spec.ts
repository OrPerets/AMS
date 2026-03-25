import { expect, test, type Page } from '@playwright/test';
import { configureClient, expectNoHorizontalOverflow, mockApi, setSession } from './support/app-fixtures';

const phoneSizes = [
  { name: 'compact', width: 375, height: 812 },
  { name: 'medium', width: 390, height: 844 },
];

async function closeNavigationOverlayIfOpen(page: Page) {
  const closeButton = page.getByRole('button', { name: /סגור תפריט ניווט|Close navigation/i });
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click({ force: true });
  }
}

test.describe('sprint 10 mobile breakpoint coverage', () => {
  test.describe.configure({ mode: 'serial', timeout: 60_000 });

  for (const size of phoneSizes) {
    test(`manager workflows stay usable on a ${size.name} phone`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await setSession(page, 'PM');
      await mockApi(page);

      await page.goto('/buildings', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
      await expect(page.getByText(/בניינים/).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'צפה' }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/home', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/מרכז העבודה|תיבת מנהל נכס/).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/payments', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/תשלומים/).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'סליקה' })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test(`resident billing surfaces stay usable on a ${size.name} phone`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await setSession(page, 'RESIDENT');
      await mockApi(page);

      await page.goto('/resident/account', { waitUntil: 'domcontentloaded' });
      await closeNavigationOverlayIfOpen(page);
      await expect(page.getByText(/מה צריך עכשיו|פעיל עכשיו|Needs attention now/i).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /שלם עכשיו|Pay now/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /בקשה חדשה/ }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/payments/resident', { waitUntil: 'domcontentloaded' });
      await closeNavigationOverlayIfOpen(page);
      await expect(page.getByRole('heading', { name: 'מרכז תשלומים' })).toBeVisible();
      await expect(page.getByRole('tab', { name: /פתוחים/ })).toBeVisible();
      await page.getByRole('button', { name: /תשלום מיידי|פתח תשלום/ }).click();
      await expect(page.getByText('תשלום מאובטח')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByText('תשלום מאובטח')).toBeHidden();
      await expectNoHorizontalOverflow(page);
    });

    test(`resident service surfaces stay usable on a ${size.name} phone`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await setSession(page, 'RESIDENT');
      await mockApi(page);

      await page.goto('/resident/requests', { waitUntil: 'domcontentloaded' });
      await closeNavigationOverlayIfOpen(page);
      await expect(page.getByText(/בקשת דייר חדשה|בקשות דייר/).first()).toBeVisible();
      await expect(page.getByRole('tab', { name: /בקשה חדשה/ })).toBeVisible();
      await page.getByRole('button', { name: /חניה.*שינוי או תקלה/ }).click();
      await expect(page.getByRole('heading', { name: 'פרטי הבקשה' })).toBeVisible();
      await expect(page.getByRole('button', { name: /שינוי הקצאה/ }).first()).toBeVisible();
      await expect(page.getByLabel('מספר רכב')).toBeVisible();
      await page.getByRole('tab', { name: /מעקב/ }).click();
      await expect(page.getByText(/בקשה לאישור חניה|שינוי פרטי התקשרות/).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/create-call', { waitUntil: 'domcontentloaded' });
      await closeNavigationOverlayIfOpen(page);
      await expect(page.getByRole('heading', { name: 'קריאה / תקלה' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'צלם תקלה עכשיו' })).toBeVisible();
      await page.getByRole('button', { name: 'שנה מיקום' }).click();
      await expect(page.getByText('בחירת מיקום')).toBeVisible();
      await page.getByRole('button', { name: 'אישור מיקום' }).click();
      await expectNoHorizontalOverflow(page);
    });
  }

  test('resident mobile shell holds up in ltr dark reduced-motion mode', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setSession(page, 'RESIDENT');
    await configureClient(page, { direction: 'ltr', theme: 'dark' });
    await mockApi(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/resident/account', { waitUntil: 'domcontentloaded' });
    await closeNavigationOverlayIfOpen(page);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ams-dark');
    await expect(page.getByText(/מה צריך עכשיו|פעיל עכשיו|Needs attention now/i).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
