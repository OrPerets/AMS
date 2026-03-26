import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { configureClient, mockApi, setSession, type SessionRole } from './support/app-fixtures';

async function setupRole(page: Page, role: SessionRole) {
  await setSession(page, role);
  await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
  await mockApi(page);
}

interface A11yTarget {
  role: SessionRole;
  path: string;
  readySelector: string;
  label: string;
}

const auditTargets: A11yTarget[] = [
  { role: 'PM', path: '/admin/dashboard', readySelector: 'text=פעולה ראשית', label: 'pm-dashboard' },
  { role: 'PM', path: '/tickets', readySelector: 'text=נזילה בלובי', label: 'pm-tickets' },
  { role: 'PM', path: '/buildings', readySelector: 'heading:has-text("ניהול בניינים")', label: 'pm-buildings' },
  { role: 'PM', path: '/settings', readySelector: 'heading:has-text("הגדרות משתמש")', label: 'pm-settings' },
  { role: 'PM', path: '/finance/reports', readySelector: 'heading:has-text("דוחות פיננסיים")', label: 'pm-finance' },
  { role: 'PM', path: '/maintenance', readySelector: 'heading:has-text("תחזוקה ותפעול")', label: 'pm-maintenance' },
  { role: 'RESIDENT', path: '/resident/account', readySelector: 'text=הבניין שלי', label: 'resident-account' },
  { role: 'RESIDENT', path: '/payments/resident', readySelector: 'heading:has-text("מרכז תשלומים")', label: 'resident-payments' },
  { role: 'RESIDENT', path: '/votes', readySelector: 'heading:has-text("הצבעות בניין")', label: 'resident-votes' },
  { role: 'TECH', path: '/gardens', readySelector: 'text=שדרות האורן', label: 'tech-gardens' },
];

test.describe('sprint 7 — axe-core accessibility audit', () => {
  test.describe.configure({ timeout: 120_000 });

  test('login page passes axe audit', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('כניסה למערכת')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(serious, `Login page has ${serious.length} serious/critical a11y violation(s): ${serious.map((v) => v.id).join(', ')}`).toHaveLength(0);
  });

  for (const target of auditTargets) {
    test(`a11y audit: ${target.label}`, async ({ page }) => {
      await setupRole(page, target.role);
      await page.goto(target.path, { waitUntil: 'domcontentloaded' });

      const readyElement = page.locator(target.readySelector).first();
      await expect(readyElement).toBeVisible({ timeout: 15_000 });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(
        serious,
        `${target.label} has ${serious.length} serious/critical a11y violation(s): ${serious.map((v) => `${v.id} (${v.impact})`).join(', ')}`,
      ).toHaveLength(0);
    });
  }

  test('contrast check: dark mode on resident account', async ({ page }) => {
    await setSession(page, 'RESIDENT');
    await configureClient(page, { direction: 'rtl', theme: 'dark', locale: 'he' });
    await mockApi(page);
    await page.goto('/resident/account', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: /הבניין שלי/ }).first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ rules: { 'color-contrast': { enabled: true } } })
      .analyze();

    const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');
    expect(
      contrastViolations.length,
      `Dark mode has ${contrastViolations.length} contrast violation(s)`,
    ).toBeLessThanOrEqual(3);
  });

  test('focus order and keyboard navigation on settings', async ({ page }) => {
    await setupRole(page, 'PM');
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'הגדרות משתמש' })).toBeVisible();

    await page.keyboard.press('Tab');
    const firstFocused = page.locator(':focus');
    await expect(firstFocused).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .options({ rules: { tabindex: { enabled: true }, 'focus-order-semantics': { enabled: true } } })
      .analyze();

    const focusViolations = results.violations.filter(
      (v) => v.id === 'tabindex' || v.id === 'focus-order-semantics',
    );
    expect(focusViolations).toHaveLength(0);
  });

  test('touch target sizes meet minimum on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupRole(page, 'PM');
    await page.goto('/tickets', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('נזילה בלובי').first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag22aa'])
      .analyze();

    const targetSizeViolations = results.violations.filter((v) => v.id === 'target-size');
    expect(
      targetSizeViolations.length,
      `Found ${targetSizeViolations.length} touch target size violation(s)`,
    ).toBeLessThanOrEqual(5);
  });
});
