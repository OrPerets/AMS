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

      await page.goto('/buildings');
      await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
      await expect(page.getByText(/Portfolio priorities/i)).toBeVisible();
      await expect(page.getByText(/Manager action console/i)).toBeVisible();
      await expect(page.getByRole('button', { name: 'צפה' }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/payments');
      await expect(page.getByRole('heading', { name: 'תשלומים', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'סליקה' })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test(`resident self-service stays usable on a ${size.name} phone`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await setSession(page, 'RESIDENT');
      await mockApi(page);

      await page.goto('/resident/account');
      await expect(page.getByText(/זה המצב שלך היום|This is your status today/i).first()).toBeVisible();
      await expect(page.getByText(/Resident priority inbox/i)).toBeVisible();
      await expect(page.getByText(/Primary actions/i)).toBeVisible();
      await expect(page.getByRole('button', { name: 'שלם עכשיו' }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto('/resident/requests');
      await expect(page.getByRole('heading', { name: 'בקשות דייר' })).toBeVisible();
      await expect(page.getByText(/Service queue/i)).toBeVisible();
      await expect(page.getByText(/שלב 1: בחר סוג בקשה/)).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});
