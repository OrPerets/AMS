import { expect, test, type Page } from '@playwright/test';
import { mockApi, setSession, type SessionRole } from './support/app-fixtures';

const futureExp = Math.floor(Date.now() / 1000) + 60 * 60;

function createToken(payload: Record<string, unknown>) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ exp: futureExp, ...payload })}.sig`;
}

async function mockLogin(page: Page, role: SessionRole) {
  await page.route('**/auth/login', async (route) => {
    const identity =
      role === 'RESIDENT'
        ? { sub: 8, email: 'client@demo.com' }
        : role === 'TECH'
          ? { sub: 9, email: 'tech@demo.com' }
          : role === 'ADMIN'
            ? { sub: 5, email: 'admin@demo.com' }
            : role === 'MASTER'
              ? { sub: 1, email: 'master@demo.com' }
              : { sub: 7, email: 'maya@demo.com' };
    const token = createToken({
      sub: identity.sub,
      email: identity.email,
      role,
      tenantId: 1,
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: token,
        refreshToken: token,
      }),
    });
  });
}

test.describe('mobile landing and login entry routing', () => {
  test('worker CTA sends authenticated staff directly to the AMS home', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/');
    const workerCta = page.getByRole('button', { name: 'כניסה לעובדים' }).first();
    await expect(workerCta).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/home$/),
      workerCta.click(),
    ]);

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('heading', { name: 'מרכז העבודה' })).toBeVisible();
  });

  test('resident CTA keeps the resident intent through login', async ({ page }) => {
    await mockApi(page);
    await mockLogin(page, 'RESIDENT');

    await page.goto('/');
    await page.getByRole('button', { name: 'כניסה לדיירים' }).first().click();
    await expect(page).toHaveURL(/\/login\?portal=resident$/);

    await page.getByLabel('אימייל').fill('client@demo.com');
    await page.locator('input[name="password"]').fill('resident1');
    await Promise.all([
      page.waitForURL(/\/resident\/account$/),
      page.getByRole('button', { name: 'התחבר' }).click(),
    ]);

    await expect(page).toHaveURL(/\/resident\/account$/);
  });

  test('worker CTA keeps the staff intent through login', async ({ page }) => {
    await mockApi(page);
    await mockLogin(page, 'TECH');

    await page.goto('/');
    await page.getByRole('button', { name: 'כניסה לעובדים' }).first().click();
    await expect(page).toHaveURL(/\/login\?portal=worker$/);

    await page.getByLabel('אימייל').fill('tech@demo.com');
    await page.locator('input[name="password"]').fill('worker1');
    await Promise.all([
      page.waitForURL(/\/home$/),
      page.getByRole('button', { name: 'התחבר' }).click(),
    ]);

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText(/משימות|תור|מרכז העבודה/).first()).toBeVisible();
  });
});
