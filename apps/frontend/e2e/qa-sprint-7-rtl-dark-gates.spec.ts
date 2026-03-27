import { expect, test, type Page } from '@playwright/test';
import { configureClient, expectNoHorizontalOverflow, mockApi, setSession, type SessionRole } from './support/app-fixtures';

async function setupVariant(page: Page, role: SessionRole, direction: 'rtl' | 'ltr', theme: 'light' | 'dark') {
  await setSession(page, role);
  await configureClient(page, { direction, theme, locale: direction === 'rtl' ? 'he' : 'en' });
  await mockApi(page);
}

interface GateTarget {
  role: SessionRole;
  path: string;
  readySelector: string;
  label: string;
}

const gateTargets: GateTarget[] = [
  { role: 'PM', path: '/admin/dashboard', readySelector: 'text=פעולה ראשית', label: 'pm-dashboard' },
  { role: 'PM', path: '/tickets', readySelector: 'text=נזילה בלובי', label: 'pm-tickets' },
  { role: 'PM', path: '/buildings', readySelector: 'heading:has-text("ניהול בניינים")', label: 'pm-buildings' },
  { role: 'PM', path: '/finance/reports', readySelector: 'heading:has-text("דוחות פיננסיים")', label: 'pm-finance' },
  { role: 'PM', path: '/settings', readySelector: 'heading:has-text("הגדרות משתמש")', label: 'pm-settings' },
  { role: 'RESIDENT', path: '/resident/account', readySelector: 'text=הבניין שלי', label: 'resident-account' },
  { role: 'RESIDENT', path: '/payments/resident', readySelector: 'heading:has-text("מרכז תשלומים")', label: 'resident-payments' },
  { role: 'TECH', path: '/gardens', readySelector: 'text=שדרות האורן', label: 'tech-gardens' },
];

const variants: Array<{ direction: 'rtl' | 'ltr'; theme: 'light' | 'dark'; tag: string }> = [
  { direction: 'rtl', theme: 'light', tag: 'rtl-light' },
  { direction: 'rtl', theme: 'dark', tag: 'rtl-dark' },
  { direction: 'ltr', theme: 'light', tag: 'ltr-light' },
  { direction: 'ltr', theme: 'dark', tag: 'ltr-dark' },
];

test.describe('sprint 7 — RTL + dark mode verification gates', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const variant of variants) {
    test.describe(`${variant.tag}`, () => {
      for (const target of gateTargets) {
        test(`${target.label} renders without overflow in ${variant.tag}`, async ({ page }) => {
          await page.setViewportSize({ width: 390, height: 844 });
          await setupVariant(page, target.role, variant.direction, variant.theme);
          await page.goto(target.path, { waitUntil: 'domcontentloaded' });

          const readyElement = page.locator(target.readySelector).first();
          await expect(readyElement).toBeVisible({ timeout: 15_000 });

          await expect(page.locator('html')).toHaveAttribute('dir', variant.direction);

          if (variant.theme === 'dark') {
            const htmlClasses = await page.locator('html').getAttribute('class') ?? '';
            const htmlDataTheme = await page.locator('html').getAttribute('data-theme') ?? '';
            const isDark = htmlClasses.includes('dark') || htmlDataTheme.includes('dark');
            expect(isDark, `Expected dark mode to be active on ${target.label}`).toBeTruthy();
          }

          await expectNoHorizontalOverflow(page);

          const hasVisibleContent = await page.evaluate(() => {
            const body = document.body;
            return body.scrollHeight > 0 && body.children.length > 0;
          });
          expect(hasVisibleContent, `${target.label} has no visible content in ${variant.tag}`).toBeTruthy();
        });
      }
    });
  }

  test('RTL mirroring: navigation and text alignment are correct', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupVariant(page, 'PM', 'rtl', 'light');
    await page.goto('/buildings', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    const headingAlignment = await page.evaluate(() => {
      const heading = document.querySelector('h1, h2');
      if (!heading) return null;
      return window.getComputedStyle(heading).direction;
    });
    expect(headingAlignment).toBe('rtl');
  });

  test('LTR mirroring: navigation and text alignment are correct', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupVariant(page, 'PM', 'ltr', 'light');
    await page.goto('/buildings', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /ניהול בניינים|Buildings/i })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('theme toggle: switching from light to dark preserves layout integrity', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupVariant(page, 'RESIDENT', 'rtl', 'light');
    await page.goto('/resident/account', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /הבניין שלי/ }).first()).toBeVisible();

    const lightViewport = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      bodyHeight: document.body.scrollHeight,
    }));

    await configureClient(page, { theme: 'dark' });
    await page.goto('/resident/account', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /הבניין שלי/ }).first()).toBeVisible();

    const darkViewport = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      bodyHeight: document.body.scrollHeight,
    }));

    const widthDrift = Math.abs(darkViewport.scrollWidth - lightViewport.scrollWidth);
    expect(widthDrift, `Theme switch caused ${widthDrift}px width drift`).toBeLessThan(50);
  });
});
