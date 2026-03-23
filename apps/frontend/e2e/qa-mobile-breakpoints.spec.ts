import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, mockApi, setSession } from './support/app-fixtures';

const phoneSizes = [
  { name: 'small', width: 360, height: 740 },
  { name: 'medium', width: 390, height: 844 },
  { name: 'large', width: 430, height: 932 },
];

test.describe('sprint 10 mobile breakpoint coverage', () => {
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
      await expect(page.getByRole('heading', { name: 'תשלומים', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'סליקה' })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test(`resident self-service stays usable on a ${size.name} phone`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await setSession(page, 'RESIDENT');
      await mockApi(page);

      await page.goto('/resident/account', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/מה חשוב עכשיו|תמונת חשבון מהירה/).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /הבניין שלי|מסמכים/ }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /שלם עכשיו|פרטי חשבון/ }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/payments/resident', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/גבייה ותשלומים|מסך התשלומים לא נטען/).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/resident/requests', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/בקשת דייר חדשה|בקשות דייר/).first()).toBeVisible();
      await expect(page.getByRole('heading', { name: 'בחר סוג בקשה', exact: true })).toBeVisible();
      await expect(page.getByText(/בחירה אחת וממשיכים|רק מה שצריך עכשיו/).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});
