import { expect, test, type Page } from '@playwright/test';

const futureExp = Math.floor(Date.now() / 1000) + 60 * 60;

function createToken(payload: Record<string, unknown>) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ exp: futureExp, ...payload })}.sig`;
}

async function setSession(page: Page, role: 'PM' | 'RESIDENT') {
  const token = createToken({
    sub: role === 'RESIDENT' ? 8 : 7,
    email: role === 'RESIDENT' ? 'client@demo.com' : 'maya@demo.com',
    role,
    tenantId: 1,
  });

  await page.addInitScript(([accessToken, refreshToken]) => {
    window.localStorage.setItem('accessToken', accessToken);
    window.localStorage.setItem('refreshToken', refreshToken);
    window.localStorage.setItem('amit-direction', 'rtl');
    window.localStorage.setItem('amit-theme', 'light');
  }, [token, token]);
}

async function mockApi(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname, searchParams } = url;

    if (pathname.includes('/notifications/user/')) {
      return route.fulfill({ json: [{ id: 1, title: 'עדכון', message: 'יש הודעה חדשה', createdAt: '2026-03-09T09:00:00.000Z', read: false }] });
    }

    if (pathname === '/api/v1/buildings') {
      return route.fulfill({
        json: [
          { id: 1, name: 'מגדל העיר', address: 'הרצל 10', totalUnits: 24, occupiedUnits: 22, manager: 'דנה לוי', status: 'ACTIVE', lastInspection: '2026-03-01T08:00:00.000Z' },
          { id: 2, name: 'נוף הגן', address: 'הגפן 4', totalUnits: 18, occupiedUnits: 16, manager: 'רון כהן', status: 'MAINTENANCE', lastInspection: '2026-02-25T08:00:00.000Z' },
        ],
      });
    }

    if (pathname === '/api/v1/tickets') {
      const queue = searchParams.get('queue') || 'TRIAGE';
      return route.fulfill({
        json: {
          items: [
            {
              id: 101,
              status: 'OPEN',
              severity: 'URGENT',
              createdAt: '2026-03-09T07:00:00.000Z',
              latestActivityAt: '2026-03-09T08:30:00.000Z',
              title: queue === 'ACTIVE' ? 'משאבת מים' : 'נזילה בלובי',
              description: 'דרושה הגעה דחופה לטיפול בתקלה.',
              category: 'אינסטלציה',
              residentContact: '050-1234567',
              residentName: 'יואב כהן',
              building: { id: 1, name: 'מגדל העיר' },
              unit: { id: 12, number: '12' },
              assignedTo: { id: 70, email: 'tech2@demo.com' },
              commentCount: 2,
              photoCount: 1,
              hasPhotos: true,
              photos: ['https://example.com/photo.jpg'],
              slaDue: '2026-03-10T09:00:00.000Z',
              slaState: 'AT_RISK',
              workOrders: [{ id: 301, status: 'OPEN', supplierName: 'אינסטלטור העיר' }],
              comments: [{ id: 1, content: 'נפתח לטיפול', createdAt: '2026-03-09T08:35:00.000Z', author: 'maya@demo.com', role: 'PM' }],
            },
          ],
          queueCounts: { TRIAGE: 4, UNASSIGNED: 1, SLA_RISK: 2, ACTIVE: 3, RESOLVED_RECENT: 5 },
          summary: { open: 6, unassigned: 1, inProgress: 3, dueToday: 2, breached: 1, resolvedToday: 4 },
          filterOptions: {
            buildings: [{ id: 1, name: 'מגדל העיר' }],
            assignees: [{ id: 70, email: 'tech2@demo.com' }],
            categories: ['אינסטלציה'],
          },
          meta: { total: 1 },
        },
      });
    }

    if (pathname === '/api/v1/users/technicians') {
      return route.fulfill({ json: [{ id: 70, email: 'tech2@demo.com', phone: '050-7654321' }] });
    }

    if (pathname.startsWith('/api/v1/buildings/') && pathname.endsWith('/units')) {
      return route.fulfill({ json: [{ id: 12, number: '12', floor: 3 }] });
    }

    if (pathname === '/api/v1/invoices') {
      return route.fulfill({
        json: [
          {
            id: 5001,
            residentId: 8,
            residentName: 'יואב כהן',
            amount: 1250,
            description: 'ועד בית מרץ',
            issueDate: '2026-03-01T00:00:00.000Z',
            dueDate: '2026-03-15T00:00:00.000Z',
            status: 'OVERDUE',
            type: 'MONTHLY',
            paymentMethod: null,
            paidAt: null,
            receiptNumber: null,
            history: [{ kind: 'PAYMENT', id: 1, status: 'FAILED', amount: 1250, createdAt: '2026-03-05T00:00:00.000Z' }],
            reminderState: 'SENT',
            collectionStatus: 'PAST_DUE',
            promiseToPayDate: null,
            collectionNotes: 'נשלחה תזכורת',
            buildingName: 'מגדל העיר',
            agingBucket: '30+',
            lastReminderAt: '2026-03-06T00:00:00.000Z',
          },
        ],
      });
    }

    if (pathname === '/api/v1/recurring-invoices') {
      return route.fulfill({
        json: [
          { id: 71, residentId: 8, residentName: 'יואב כהן', title: 'ועד בית', recurrence: 'monthly', amount: 850, active: true, nextRunAt: '2026-04-01T00:00:00.000Z', dueDaysAfterIssue: 10, lateFeeAmount: 0 },
        ],
      });
    }

    if (pathname === '/api/v1/users/residents') {
      return route.fulfill({
        json: [
          {
            id: 8,
            user: { id: 8, email: 'client@demo.com', phone: '050-1234567' },
            units: [{ id: 12, number: '12', building: { id: 1, name: 'מגדל העיר', address: 'הרצל 10' } }],
          },
        ],
      });
    }

    if (pathname === '/api/v1/invoices/collections/summary') {
      return route.fulfill({
        json: {
          totals: {
            invoiceCount: 4,
            unpaidCount: 2,
            overdueCount: 1,
            outstandingBalance: 3250,
            delinquencyRate: 12,
            billedThisMonth: 4200,
            collectedThisMonth: 2800,
          },
          aging: { '0-30': 1200, '31-60': 2050 },
          topDebtors: [{ residentId: 8, residentName: 'יואב כהן', buildingName: 'מגדל העיר', amount: 2050, overdueCount: 2, promiseToPayDate: null }],
          followUps: [{ invoiceId: 5001, residentId: 8, residentName: 'יואב כהן', buildingName: 'מגדל העיר', collectionStatus: 'PAST_DUE', reminderState: 'SENT', promiseToPayDate: null, lastReminderAt: '2026-03-06T00:00:00.000Z', collectionNotes: 'נשלחה תזכורת' }],
        },
      });
    }

    if (pathname === '/api/v1/users/account') {
      return route.fulfill({
        json: {
          user: { id: 8, email: 'client@demo.com', phone: '050-1234567', role: 'RESIDENT' },
          residentId: 8,
          units: [{ id: 12, number: '12', building: { id: 1, name: 'מגדל העיר', address: 'הרצל 10' } }],
          notifications: [{ id: 91, title: 'אסיפה', message: 'מחר ב-19:00', createdAt: '2026-03-09T08:00:00.000Z', read: false }],
          documents: [{ id: 1, name: 'פרוטוקול ועד', category: 'meeting_summary', url: 'https://example.com/doc.pdf', uploadedAt: '2026-03-07T00:00:00.000Z' }],
          tickets: [{ id: 101, status: 'OPEN', createdAt: '2026-03-08T00:00:00.000Z', unit: { number: '12', building: { name: 'מגדל העיר' } } }],
          recentActivity: [{ id: 31, summary: 'התקבלה הודעת ועד', createdAt: '2026-03-09T06:00:00.000Z', severity: 'INFO' }],
        },
      });
    }

    if (pathname === '/api/v1/invoices/account/8') {
      return route.fulfill({
        json: {
          summary: { currentBalance: 1250, unpaidInvoices: 1, overdueInvoices: 1, openTickets: 1, unreadNotifications: 1 },
          invoices: [{ id: 5001, amount: 1250, dueDate: '2026-03-15T00:00:00.000Z', status: 'OVERDUE', description: 'ועד בית מרץ' }],
          ledger: [{ id: 'a1', type: 'charge', amount: 1250, createdAt: '2026-03-01T00:00:00.000Z', summary: 'חיוב חודשי' }],
          communications: [{ id: 701, subject: 'עדכון', message: 'בוצע טיפול בחניון', createdAt: '2026-03-08T00:00:00.000Z' }],
        },
      });
    }

    if (pathname === '/api/v1/payments/methods') {
      return route.fulfill({
        json: [{ id: 1, provider: 'tranzila', brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2028, isDefault: true, networkTokenized: true }],
      });
    }

    if (pathname === '/api/v1/payments/autopay') {
      return route.fulfill({ json: { autopayEnabled: true } });
    }

    return route.fulfill({ json: {} });
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasOverflow).toBeFalsy();
}

test.describe('mobile support smoke', () => {
  test('mobile shell drawer opens and navigates to buildings', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/home');
    await expect(page.getByRole('heading', { name: 'ברוכים הבאים לעמית אקסלנס' })).toBeVisible();
    await page.getByRole('button', { name: 'פתח תפריט' }).click();
    await expect(page.getByRole('link', { name: 'בניינים ויחידות', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'בניינים ויחידות', exact: true }).click();
    await expect(page).toHaveURL(/\/buildings$/);
    await expect(page.getByRole('heading', { name: 'ניהול בניינים' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('buildings page uses mobile cards without overflow', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/buildings');
    await expect(page.getByText('מגדל העיר')).toBeVisible();
    await expect(page.getByRole('button', { name: 'צפה' }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('payments page keeps critical finance actions reachable on mobile', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'PM');

    await page.goto('/payments');
    await expect(page.getByRole('heading', { name: 'תשלומים', exact: true })).toBeVisible();
    await expect(page.getByText('#5001 · ועד בית מרץ')).toBeVisible();
    await expect(page.getByRole('button', { name: 'סליקה' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'צור חשבונית' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('resident account renders mobile summary and payment section', async ({ page }) => {
    await mockApi(page);
    await setSession(page, 'RESIDENT');

    await page.goto('/resident/account');
    await expect(page.getByRole('heading', { name: 'האזור האישי של הדייר' })).toBeVisible();
    await expect(page.getByText('ועד בית מרץ')).toBeVisible();
    await expect(page.getByRole('button', { name: 'שלם עכשיו' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
