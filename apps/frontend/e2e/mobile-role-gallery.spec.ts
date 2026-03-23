import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { configureClient, expectNoHorizontalOverflow, mockApi, setSession, type SessionRole } from './support/app-fixtures';

const outputDir = path.resolve(__dirname, '../../../reports/mobile-role-gallery');

type CaptureScenario = {
  file: string;
  role: SessionRole;
  route: string;
  readyText: RegExp;
};

const scenarios: CaptureScenario[] = [
  {
    file: 'resident-account-mobile.png',
    role: 'RESIDENT',
    route: '/resident/account',
    readyText: /תמונת חשבון מהירה|Quick account view/i,
  },
  {
    file: 'admin-home-mobile.png',
    role: 'ADMIN',
    route: '/home',
    readyText: /תיבת עדיפויות/,
  },
  {
    file: 'pm-home-mobile.png',
    role: 'PM',
    route: '/home',
    readyText: /תיבת מנהל נכס|Priority inbox/i,
  },
  {
    file: 'tech-home-mobile.png',
    role: 'TECH',
    route: '/home',
    readyText: /תור העבודות להיום/,
  },
  {
    file: 'master-home-mobile.png',
    role: 'MASTER',
    route: '/home',
    readyText: /תיבת עדיפויות/,
  },
];

test.describe('mobile role gallery capture', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('captures representative mobile screens for each primary role', async ({ page }) => {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await mockApi(page);

    for (const scenario of scenarios) {
      await setSession(page, scenario.role);
      await configureClient(page, {
        direction: 'rtl',
        theme: 'light',
        locale: 'he',
      });

      await page.goto(scenario.route, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(scenario.readyText).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.screenshot({
        path: path.join(outputDir, scenario.file),
        fullPage: false,
      });
    }
  });
});
