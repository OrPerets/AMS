import { expect, test } from '@playwright/test';
import { configureClient, mockApi, setSession, type SessionRole } from './support/app-fixtures';

const roleScenarios: Array<{ role: SessionRole; label: string }> = [
  { role: 'PM', label: 'מנהל נכס' },
  { role: 'ADMIN', label: 'מנהל מערכת' },
  { role: 'TECH', label: 'טכנאי' },
];

test.describe('sprint 2 home shell', () => {
  for (const scenario of roleScenarios) {
    test(`shows first action above fold for ${scenario.role}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await setSession(page, scenario.role);
      await configureClient(page, { direction: 'rtl', theme: 'light', locale: 'he' });
      await mockApi(page);

      await page.goto('/home', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'מרכז העבודה' })).toBeVisible();
      await expect(page.getByText(scenario.label)).toBeVisible();

      const primaryCard = page.getByTestId('primary-action-card');
      const primaryCta = page.getByTestId('primary-action-cta');
      await expect(primaryCard).toBeVisible();
      await expect(primaryCta).toBeVisible();

      const cardBox = await primaryCard.boundingBox();
      expect(cardBox).not.toBeNull();
      expect((cardBox?.y ?? 0) + (cardBox?.height ?? 0)).toBeLessThanOrEqual(844);
    });
  }
});
