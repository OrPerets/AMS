import { expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const futureExp = Math.floor(Date.now() / 1000) + 60 * 60;

export type SessionRole = 'PM' | 'RESIDENT';

export type MockScenario = {
  dashboardFailures?: number;
  financeFailures?: number;
  settingsFailures?: number;
  financeDelayMs?: number;
};

function createToken(payload: Record<string, unknown>) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ exp: futureExp, ...payload })}.sig`;
}

export async function setSession(page: Page, role: SessionRole) {
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
    window.localStorage.setItem('amit-locale', 'he');
  }, [token, token]);
}

export async function configureClient(page: Page, options: { direction?: 'rtl' | 'ltr'; theme?: 'light' | 'dark'; locale?: 'he' | 'en' }) {
  await page.addInitScript((settings) => {
    if (settings.direction) {
      window.localStorage.setItem('amit-direction', settings.direction);
    }
    if (settings.theme) {
      window.localStorage.setItem('amit-theme', settings.theme);
    }
    if (settings.locale) {
      window.localStorage.setItem('amit-locale', settings.locale);
    }
  }, options);
}

export async function mockApi(page: Page, scenario: MockScenario = {}) {
  let dashboardFailuresRemaining = scenario.dashboardFailures ?? 0;
  let financeFailuresRemaining = scenario.financeFailures ?? 0;
  let settingsFailuresRemaining = scenario.settingsFailures ?? 0;

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname, searchParams } = url;
    const method = route.request().method();

    if (pathname.includes('/notifications/user/')) {
      return route.fulfill({
        json: [
          {
            id: 1,
            title: 'עדכון',
            message: 'יש הודעה חדשה',
            type: 'INFO',
            createdAt: '2026-03-09T09:00:00.000Z',
            read: false,
            buildingName: 'מגדל העיר',
          },
        ],
      });
    }

    if (pathname.match(/\/api\/v1\/notifications\/\d+\/read$/) && method === 'POST') {
      return route.fulfill({ status: 200, json: { success: true } });
    }

    if (pathname === '/api/v1/users/profile') {
      if (settingsFailuresRemaining > 0) {
        settingsFailuresRemaining -= 1;
        return route.fulfill({ status: 500, body: 'profile unavailable' });
      }

      return route.fulfill({
        json: {
          id: 7,
          email: 'maya@demo.com',
          phone: '050-7654321',
          pushToken: 'push-demo-token',
          role: 'PM',
          buildingId: 1,
          notificationPreferences: {
            email: true,
            sms: false,
            push: true,
            ticketUpdates: true,
            maintenanceReminders: true,
            paymentReminders: true,
            announcements: true,
            emergencyAlerts: true,
            workOrderUpdates: true,
            general: true,
          },
          resident: {
            units: [
              {
                id: 12,
                building: { id: 1, name: 'מגדל העיר', address: 'הרצל 10' },
              },
            ],
          },
        },
      });
    }

    if (pathname === '/api/v1/buildings') {
      return route.fulfill({
        json: [
          {
            id: 1,
            name: 'מגדל העיר',
            address: 'הרצל 10',
            totalUnits: 24,
            occupiedUnits: 22,
            manager: 'דנה לוי',
            status: 'ACTIVE',
            lastInspection: '2026-03-01T08:00:00.000Z',
          },
          {
            id: 2,
            name: 'נוף הגן',
            address: 'הגפן 4',
            totalUnits: 18,
            occupiedUnits: 16,
            manager: 'רון כהן',
            status: 'MAINTENANCE',
            lastInspection: '2026-02-25T08:00:00.000Z',
          },
        ],
      });
    }

    if (pathname.match(/\/api\/v1\/buildings\/\d+\/overview$/)) {
      return route.fulfill({
        json: {
          building: { id: 1, name: 'מגדל העיר', address: 'הרצל 10', totalUnits: 24, occupiedUnits: 22, status: 'ACTIVE' },
          metrics: {
            totalUnits: 24,
            openTickets: 6,
            activeMaintenanceSchedules: 4,
            assetCount: 31,
            activeContracts: 5,
          },
          financial: {
            planned: 120000,
            actual: 113500,
            variance: -6500,
          },
          upcomingMaintenance: [
            { id: 1, title: 'בדיקת משאבות', nextOccurrence: '2026-03-25T08:00:00.000Z', priority: 'HIGH' },
            { id: 2, title: 'תחזוקת גנרטור', nextOccurrence: '2026-03-28T08:00:00.000Z', priority: 'NORMAL' },
          ],
        },
      });
    }

    if (pathname.startsWith('/api/v1/buildings/') && pathname.endsWith('/units')) {
      return route.fulfill({ json: [{ id: 12, number: '12', floor: 3 }] });
    }

    if (pathname === '/api/v1/dashboard/overview') {
      if (dashboardFailuresRemaining > 0) {
        dashboardFailuresRemaining -= 1;
        return route.fulfill({ status: 500, body: 'dashboard unavailable' });
      }

      return route.fulfill({
        json: {
          filters: {
            selectedBuildingId: searchParams.get('buildingId') ? Number(searchParams.get('buildingId')) : null,
            range: searchParams.get('range') || '30d',
            rangeLabel: '30 ימים',
            buildings: [{ id: 1, name: 'מגדל העיר' }, { id: 2, name: 'נוף הגן' }],
          },
          portfolioKpis: {
            openTickets: 6,
            urgentTickets: 2,
            slaBreaches: 1,
            unpaidBalance: 3250,
            overdueInvoices: 1,
            occupiedUnits: 38,
            vacantUnits: 4,
            resolvedToday: 4,
            resolvedInRange: 19,
            createdInRange: 23,
          },
          attentionItems: [
            {
              id: 'sla',
              tone: 'warning',
              title: 'נדרש טיפול SLA',
              value: '2 קריאות',
              description: 'קריאות בסיכון שמחכות להקצאה או עדכון.',
              ctaLabel: 'ללוח הקריאות',
              ctaHref: '/tickets',
            },
          ],
          ticketTrends: {
            ticketsByStatus: { OPEN: 4, IN_PROGRESS: 2, RESOLVED: 9 },
            monthlyTrend: [{ month: 'Jan', count: 8 }, { month: 'Feb', count: 11 }, { month: 'Mar', count: 9 }],
            buildingLoad: [
              { buildingId: 1, buildingName: 'מגדל העיר', openTickets: 4, urgentTickets: 1, inProgressTickets: 2, slaBreaches: 1 },
            ],
          },
          collectionsSummary: {
            unpaidBalance: 3250,
            overdueInvoices: 1,
            pendingInvoices: 2,
            topDebtors: [{ residentId: 8, residentName: 'יואב כהן', amount: 2050, overdueCount: 2 }],
          },
          maintenanceSummary: {
            overdue: 1,
            dueToday: 2,
            dueInRange: 4,
            upcoming: [
              {
                id: 71,
                title: 'בדיקת מערכות כיבוי',
                priority: 'HIGH',
                nextOccurrence: '2026-03-24T09:00:00.000Z',
                buildingName: 'מגדל העיר',
                assignedTo: 'tech2@demo.com',
              },
            ],
          },
          recentNotifications: [
            {
              id: 1,
              title: 'הודעת מערכת',
              message: 'העלאה חדשה ממתינה לאישור',
              type: 'SYSTEM',
              read: false,
              createdAt: '2026-03-09T08:00:00.000Z',
              buildingName: 'מגדל העיר',
            },
          ],
          buildingRiskList: [
            {
              buildingId: 1,
              buildingName: 'מגדל העיר',
              address: 'הרצל 10',
              managerName: 'דנה לוי',
              totalUnits: 24,
              occupiedUnits: 22,
              vacantUnits: 2,
              openTickets: 4,
              urgentTickets: 1,
              inProgressTickets: 2,
              slaBreaches: 1,
              unpaidAmount: 2050,
              overdueInvoices: 2,
              upcomingMaintenance: 3,
              complianceExpiries: 1,
              lastManagerActivity: '2026-03-09T07:30:00.000Z',
              riskScore: 64,
            },
          ],
          systemAdmin: {
            stats: {
              totalUsers: 128,
              totalBuildings: 9,
              openTickets: 6,
              unpaidInvoices: 2,
              activeTechs: 5,
              activeUsersInRange: 43,
              activityEventsInRange: 187,
              pendingApprovals: 2,
            },
            health: {
              api: { status: 'healthy', label: 'API', value: '99.9%', description: 'זמינות יציבה' },
              jobs: { status: 'warning', label: 'Jobs', value: '2 עיכובים', description: 'תור ממתין לטיפול' },
            },
            roleCounts: { ADMIN: 2, PM: 4, TECH: 5, RESIDENT: 117 },
            users: [{ id: 7, email: 'maya@demo.com', role: 'PM', tenantId: 1, phone: '050-7654321', createdAt: '2025-08-01T00:00:00.000Z' }],
            recentImpersonationEvents: [{ id: 1, action: 'START', targetRole: 'RESIDENT', reason: 'בדיקת תמיכה', createdAt: '2026-03-08T14:00:00.000Z' }],
            techWorkload: [{ techId: 70, email: 'tech2@demo.com', assignedOpenTickets: 3, urgentOpenTickets: 1, slaBreaches: 0, loadBand: 'balanced' }],
            bottlenecks: [{ id: 'sla-risk', title: 'קריאות בסיכון', count: 2, tone: 'warning', description: 'דורש הקצאה', href: '/tickets' }],
          },
        },
      });
    }

    if (pathname === '/api/v1/tickets') {
      const queue = searchParams.get('queue') || 'TRIAGE';
      return route.fulfill({
        json: {
          items: [
            {
              id: 101,
              unitId: 12,
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
              assignedTo: { id: 70, email: 'tech2@demo.com', role: 'TECH' },
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
          workload: [
            {
              technicianId: 70,
              technicianEmail: 'tech2@demo.com',
              activeCount: 3,
              riskCount: 1,
              breachedCount: 0,
              urgentCount: 1,
              lastActivityAt: '2026-03-09T08:30:00.000Z',
            },
          ],
          riskSummary: {
            triage: 4,
            unassigned: 1,
            atRisk: 2,
            dueToday: 2,
            breached: 1,
          },
          meta: { total: 1 },
        },
      });
    }

    if (pathname === '/api/v1/tickets/101') {
      return route.fulfill({
        json: {
          id: 101,
          unitId: 12,
          status: 'OPEN',
          severity: 'URGENT',
          description: 'נזילה בלובי הבניין',
          photos: ['https://example.com/photo.jpg'],
          comments: [
            {
              id: 1,
              content: 'נפתח לטיפול',
              createdAt: '2026-03-09T08:35:00.000Z',
              author: { id: 7, email: 'maya@demo.com', role: 'PM' },
            },
          ],
          unit: { building: { name: 'מגדל העיר' } },
          assignedTo: { id: 70, email: 'tech2@demo.com', role: 'TECH' },
        },
      });
    }

    if (pathname.match(/\/api\/v1\/tickets\/101\/(status|assign|comments)$/) || pathname.match(/\/api\/v1\/tickets\/comments\/\d+$/)) {
      return route.fulfill({ status: 200, json: { success: true } });
    }

    if (pathname === '/api/v1/users/technicians') {
      return route.fulfill({ json: [{ id: 70, email: 'tech2@demo.com', phone: '050-7654321' }] });
    }

    if (pathname === '/api/v1/vendors') {
      return route.fulfill({ json: [{ id: 1, name: 'אינסטלטור העיר', isActive: true, skills: ['אינסטלציה', 'חירום'] }] });
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
          units: [{ id: 12, number: '12', building: { id: 1, name: 'מגדל העיר', address: 'הרצל 10', managerName: 'דנה לוי', contactPhone: '03-5550000' } }],
          notifications: [{ id: 91, title: 'אסיפה', message: 'מחר ב-19:00', createdAt: '2026-03-09T08:00:00.000Z', read: false }],
          documents: [{ id: 1, name: 'פרוטוקול ועד', category: 'meeting_summary', url: 'https://example.com/doc.pdf', uploadedAt: '2026-03-07T00:00:00.000Z' }],
          tickets: [{ id: 101, status: 'OPEN', severity: 'URGENT', createdAt: '2026-03-08T00:00:00.000Z', unit: { number: '12', building: { name: 'מגדל העיר' } }, comments: [], workOrders: [] }],
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

    if (pathname === '/api/v1/communications/resident-requests') {
      return route.fulfill({
        json: [
          {
            requestKey: 'REQ-701',
            subject: 'בקשה לאישור חניה',
            requestType: 'PARKING',
            status: 'IN_REVIEW',
            message: 'נדרש אישור עבור חניה זמנית לאורח.',
            createdAt: '2026-03-08T09:00:00.000Z',
            updatedAt: '2026-03-08T11:00:00.000Z',
            requestedDate: '2026-03-12',
            statusNotes: 'הבקשה בטיפול צוות הניהול.',
          },
          {
            requestKey: 'REQ-702',
            subject: 'שינוי פרטי התקשרות',
            requestType: 'CONTACT_UPDATE',
            status: 'COMPLETED',
            message: 'עודכן מספר הטלפון במערכת.',
            createdAt: '2026-03-04T09:00:00.000Z',
            updatedAt: '2026-03-05T10:00:00.000Z',
            requestedDate: null,
            statusNotes: 'הפרטים עודכנו בהצלחה.',
          },
        ],
      });
    }

    if (pathname === '/api/v1/communications/resident-request' && method === 'POST') {
      return route.fulfill({ status: 201, json: { success: true } });
    }

    if (pathname === '/api/v1/reports/financial/monthly') {
      if (scenario.financeDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, scenario.financeDelayMs));
      }
      if (financeFailuresRemaining > 0) {
        financeFailuresRemaining -= 1;
        return route.fulfill({ status: 500, body: 'report unavailable' });
      }

      return route.fulfill({
        json: {
          month: Number(searchParams.get('month') || '3'),
          year: Number(searchParams.get('year') || '2026'),
          buildingId: searchParams.get('buildingId') ? Number(searchParams.get('buildingId')) : 1,
          buildingName: 'מגדל העיר',
          expenses: [
            {
              category: 'תחזוקה',
              total: 4200,
              items: [{ id: 1, description: 'שירות מעליות', amount: 2200 }, { id: 2, description: 'ניקיון', amount: 2000 }],
            },
          ],
          income: [
            {
              source: 'ועד בית',
              total: 6300,
              items: [{ id: 1, description: 'גבייה חודשית', amount: 6300 }],
            },
          ],
          totalExpenses: 4200,
          totalIncome: 6300,
          balance: 2100,
        },
      });
    }

    if (pathname === '/api/v1/reports/financial/yearly') {
      return route.fulfill({
        json: {
          year: Number(searchParams.get('year') || '2026'),
          buildingId: searchParams.get('buildingId') ? Number(searchParams.get('buildingId')) : 1,
          buildingName: 'מגדל העיר',
          months: [
            { month: 'ינואר', year: 2026, expenses: [], income: [], totalExpenses: 4100, totalIncome: 5900, balance: 1800 },
            { month: 'פברואר', year: 2026, expenses: [], income: [], totalExpenses: 4300, totalIncome: 6200, balance: 1900 },
            { month: 'מרץ', year: 2026, expenses: [], income: [], totalExpenses: 4200, totalIncome: 6300, balance: 2100 },
          ],
          totalIncome: 18400,
          totalExpenses: 12600,
          totalBalance: 5800,
        },
      });
    }

    if (pathname === '/api/v1/maintenance') {
      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          json: {
            id: 99,
            buildingId: 1,
            title: 'בדיקת גנרטור',
            category: 'SAFETY',
            type: 'PREVENTIVE',
            frequency: 'MONTHLY',
            startDate: '2026-03-21',
            priority: 'HIGH',
            completionVerified: false,
            building: { id: 1, name: 'מגדל העיר' },
          },
        });
      }

      return route.fulfill({
        json: [
          {
            id: 51,
            buildingId: 1,
            title: 'בדיקת משאבות',
            description: 'בדיקה מונעת לרבעון',
            category: 'PLUMBING',
            type: 'PREVENTIVE',
            frequency: 'MONTHLY',
            startDate: '2026-03-01T00:00:00.000Z',
            nextOccurrence: '2026-03-25T00:00:00.000Z',
            priority: 'HIGH',
            estimatedCost: 1800,
            lastCompleted: '2026-02-25T00:00:00.000Z',
            completionVerified: true,
            building: { id: 1, name: 'מגדל העיר' },
            assignedTo: { id: 70, email: 'tech2@demo.com' },
            histories: [{ id: 1 }],
          },
          {
            id: 52,
            buildingId: 2,
            title: 'ניקוי מאגר מים',
            description: 'פעולה מתקנת',
            category: 'SANITATION',
            type: 'CORRECTIVE',
            frequency: 'ONCE',
            startDate: '2026-03-05T00:00:00.000Z',
            nextOccurrence: '2026-03-22T00:00:00.000Z',
            priority: 'NORMAL',
            estimatedCost: 950,
            lastCompleted: null,
            completionVerified: false,
            building: { id: 2, name: 'נוף הגן' },
            assignedTo: null,
            histories: [],
          },
        ],
      });
    }

    if (pathname.match(/\/api\/v1\/maintenance\/building\/\d+\/alerts$/)) {
      return route.fulfill({
        json: [
          {
            id: 81,
            buildingId: 1,
            title: 'בדיקת משאבות',
            category: 'PLUMBING',
            type: 'PREVENTIVE',
            frequency: 'MONTHLY',
            startDate: '2026-03-01T00:00:00.000Z',
            nextOccurrence: '2026-03-25T00:00:00.000Z',
            priority: 'HIGH',
            completionVerified: true,
            building: { id: 1, name: 'מגדל העיר' },
          },
        ],
      });
    }

    if (pathname.match(/\/api\/v1\/maintenance\/building\/\d+\/cost-projection$/)) {
      return route.fulfill({
        json: {
          totalEstimatedCost: 4200,
          byPriority: {
            HIGH: { count: 2, estimatedCost: 2600 },
            NORMAL: { count: 1, estimatedCost: 1600 },
          },
        },
      });
    }

    if (pathname === '/api/v1/votes/building/1') {
      return route.fulfill({
        json: [
          {
            id: 901,
            title: 'שדרוג לובי',
            question: 'האם לאשר שדרוג תאורה בלובי?',
            endDate: '2026-03-30T00:00:00.000Z',
            isActive: true,
            isClosed: false,
            userHasVoted: false,
            responseCount: 9,
            voteType: 'MAJORITY',
            buildingId: 1,
          },
          {
            id: 902,
            title: 'בחירת ספק ניקיון',
            question: 'בחירת ספק לשנה הקרובה',
            endDate: '2026-04-14T00:00:00.000Z',
            isActive: false,
            isClosed: false,
            userHasVoted: false,
            responseCount: 0,
            voteType: 'MAJORITY',
            buildingId: 1,
          },
          {
            id: 903,
            title: 'אישור תקציב 2025',
            question: 'האם לאשר את תקציב הבניין?',
            endDate: '2026-02-20T00:00:00.000Z',
            isActive: false,
            isClosed: true,
            userHasVoted: true,
            responseCount: 18,
            voteType: 'SPECIAL',
            buildingId: 1,
          },
        ],
      });
    }

    return route.fulfill({ json: {} });
  });
}

export async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasOverflow).toBeFalsy();
}

export async function captureEvidence(page: Page, testInfo: TestInfo, filename: string) {
  const evidenceDir = path.resolve(testInfo.config.rootDir, '../../../reports/sprint-10/evidence/screenshots');
  await fs.mkdir(evidenceDir, { recursive: true });
  await page.screenshot({
    path: path.join(evidenceDir, filename),
    fullPage: true,
  });
}
