import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { configureClient, expectNoHorizontalOverflow, mockApi, setSession } from './support/app-fixtures';

async function captureToMobilePolish(page: Page, testInfo: TestInfo, filename: string) {
  const evidenceDir = path.resolve(testInfo.config.rootDir, '../../../reports/mobile-polish/evidence/screenshots');
  await fs.mkdir(evidenceDir, { recursive: true });
  await page.screenshot({
    path: path.join(evidenceDir, filename),
    fullPage: false,
  });
}

const scenarios = [
  {
    name: 'pm-light-rtl',
    role: 'PM' as const,
    theme: 'light' as const,
    direction: 'rtl' as const,
    locale: 'he' as const,
  },
  {
    name: 'resident-dark-ltr',
    role: 'RESIDENT' as const,
    theme: 'dark' as const,
    direction: 'ltr' as const,
    locale: 'en' as const,
  },
];

test.describe('mobile polish smoke', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const scenario of scenarios) {
    test(`home, notifications, settings and resident account render cleanly for ${scenario.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await setSession(page, scenario.role);
      await configureClient(page, {
        direction: scenario.direction,
        theme: scenario.theme,
        locale: scenario.locale,
      });
      await mockApi(page);

      await page.goto('/home', { waitUntil: 'domcontentloaded' });
      if (scenario.role === 'RESIDENT') {
        await expect(page.getByRole('heading', { name: /האזור האישי/i }).first()).toBeVisible();
        await expect(page.getByText(/מה צריך עכשיו/i).first()).toBeVisible();
      } else {
        await expect(page.getByRole('heading', { name: /תיבת מנהל נכס|Priority inbox/i }).first()).toBeVisible();
        await expect(page.getByText(/מה דורש טיפול עכשיו|requires action now/i).first()).toBeVisible();
      }
      await expectNoHorizontalOverflow(page);
      await captureToMobilePolish(page, testInfo, `home-${scenario.name}.png`);

      await page.goto('/notifications', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/התראות|Notifications/i).first()).toBeVisible();
      await expect(page.getByText(/העדפות|Preferences/i).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await captureToMobilePolish(page, testInfo, `notifications-${scenario.name}.png`);

      await page.goto('/settings', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/הגדרות משתמש|User settings/i).first()).toBeVisible();
      await expect(page.getByText(/פרופיל|Profile/i).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await captureToMobilePolish(page, testInfo, `settings-${scenario.name}.png`);

      await page.goto(scenario.role === 'RESIDENT' ? '/resident/account' : '/buildings', { waitUntil: 'domcontentloaded' });
      if (scenario.role === 'RESIDENT') {
        await expect(page.getByRole('link', { name: /הבניין שלי/ }).first()).toBeVisible();
        await expect(page.getByText(/האזור האישי|שלם עכשיו/).first()).toBeVisible();
      } else {
        await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'צפה' }).first()).toBeVisible();
      }
      await expectNoHorizontalOverflow(page);
      await captureToMobilePolish(page, testInfo, `resident-account-${scenario.name}.png`);
    });
  }

  test('gardens manager and worker screenshots render cleanly', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockApi(page);

    await setSession(page, 'PM');
    await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
    await page.goto('/gardens', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'ניהול גננים' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureToMobilePolish(page, testInfo, 'gardens-manager-pm-light-rtl.png');

    await setSession(page, 'TECH');
    await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
    await page.goto('/gardens', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /נדרשים תיקונים לפני אישור|המשך לעדכן את החודש הפעיל/ })).toBeVisible();
    await expect(page.getByText(/המשך לערוך או הגש לאישור|החודש סגור לעריכה/).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureToMobilePolish(page, testInfo, 'gardens-worker-tech-light-rtl.png');
  });
});
