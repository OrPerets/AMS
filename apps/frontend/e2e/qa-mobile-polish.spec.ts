import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { configureClient, expectNoHorizontalOverflow, mockApi, setSession } from './support/app-fixtures';

async function captureToMobilePolish(page: Page, testInfo: TestInfo, filename: string) {
  const evidenceDir = path.resolve(testInfo.config.rootDir, '../../../reports/mobile-polish/evidence/screenshots');
  await fs.mkdir(evidenceDir, { recursive: true });
  await page.screenshot({
    path: path.join(evidenceDir, filename),
    fullPage: true,
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

      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/Priority inbox/i).first()).toBeVisible();
      await expect(page.getByText(/פעולות ראשיות|Primary actions/i).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await captureToMobilePolish(page, testInfo, `home-${scenario.name}.png`);

      await page.goto('/notifications');
      await expect(page.getByText(/התראות|Notifications/i).first()).toBeVisible();
      await expect(page.getByText(/העדפות|Preferences/i).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await captureToMobilePolish(page, testInfo, `notifications-${scenario.name}.png`);

      await page.goto('/settings');
      await expect(page.getByText(/הגדרות משתמש|User settings/i).first()).toBeVisible();
      await expect(page.getByText(/פרופיל|Profile/i).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await captureToMobilePolish(page, testInfo, `settings-${scenario.name}.png`);

      await page.goto('/resident/account');
      await expect(page.getByText(/זה המצב שלך היום|This is your status today/i).first()).toBeVisible();
      await expect(page.getByText(/Resident priority inbox/i).first()).toBeVisible();
      await expect(page.getByText(/Primary actions/i).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await captureToMobilePolish(page, testInfo, `resident-account-${scenario.name}.png`);
    });
  }
});
