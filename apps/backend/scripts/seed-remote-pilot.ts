import {
  ActivitySeverity,
  ApprovalTaskStatus,
  ApprovalTaskType,
  BudgetStatus,
  CollectionStatus,
  ExpenseCategory,
  ExpenseStatus,
  InvoiceReminderState,
  InvoiceStatus,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceType,
  PaymentIntentStatus,
  Role,
  TaskStatus,
  TaskType,
  TicketSeverity,
  TicketStatus,
  WorkOrderStatus,
  ScheduleStatus,
  PrismaClient,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PILOT_BUILDING_ADDRESS = 'חנה רובינא 42, הרצליה';
const PILOT_UNIT_NUMBER = '101';
const DEFAULT_TENANT_ID = 1;

type DesiredUser = {
  slot: 'master' | 'admin' | 'pm' | 'tech' | 'resident';
  email: string;
  role: Role;
  password: string;
  phone?: string | null;
  sourceEmails: string[];
};

const desiredUsers: DesiredUser[] = [
  {
    slot: 'master',
    email: 'master@demo.com',
    role: Role.MASTER,
    password: 'master123',
    phone: null,
    sourceEmails: ['master@demo.com'],
  },
  {
    slot: 'admin',
    email: 'admin@demo.com',
    role: Role.ADMIN,
    password: 'password123',
    phone: '050-4000001',
    sourceEmails: ['admin@demo.com', 'amit@amit-ex.net', 'office@amit-ex.net'],
  },
  {
    slot: 'pm',
    email: 'pm@demo.com',
    role: Role.PM,
    password: 'password123',
    phone: '050-4000002',
    sourceEmails: ['pm@demo.com', 'omerdor0@gmail.com'],
  },
  {
    slot: 'tech',
    email: 'tech@demo.com',
    role: Role.TECH,
    password: 'password123',
    phone: '050-4000003',
    sourceEmails: ['tech@demo.com', 'office1@amit-ex.net'],
  },
  {
    slot: 'resident',
    email: 'resident@demo.com',
    role: Role.RESIDENT,
    password: 'password123',
    phone: '050-4000004',
    sourceEmails: ['resident@demo.com', 'zagayer@gmail.com', 'orperets11@gmail.com'],
  },
];

function daysFromNow(days: number, hours = 9, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function daysAgo(days: number, hours = 9, minutes = 0) {
  return daysFromNow(-days, hours, minutes);
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.');
  }

  const building = await prisma.building.findFirst({
    where: { address: PILOT_BUILDING_ADDRESS, tenantId: DEFAULT_TENANT_ID },
    include: {
      units: {
        orderBy: { number: 'asc' },
      },
    },
  });

  if (!building) {
    throw new Error(`Pilot building not found: ${PILOT_BUILDING_ADDRESS}`);
  }

  const pilotUnit =
    building.units.find((unit) => unit.number === PILOT_UNIT_NUMBER) ??
    building.units[0];

  if (!pilotUnit) {
    throw new Error(`No units found for ${PILOT_BUILDING_ADDRESS}`);
  }

  const existingUsers = await prisma.user.findMany({
    include: {
      resident: {
        include: {
          units: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  const claimedIds = new Set<number>();
  const selectedUsers = new Map<DesiredUser['slot'], (typeof existingUsers)[number]>();

  for (const desired of desiredUsers) {
    const byEmail = existingUsers.find(
      (user) => !claimedIds.has(user.id) && desired.sourceEmails.includes(user.email),
    );
    const byRole =
      byEmail ??
      existingUsers.find((user) => {
        if (claimedIds.has(user.id) || user.role !== desired.role) {
          return false;
        }
        if (desired.role !== Role.RESIDENT) {
          return true;
        }
        return (user.resident?.units.length ?? 0) > 0;
      });

    if (!byRole) {
      throw new Error(`Could not find an existing user to repurpose for ${desired.slot}.`);
    }

    claimedIds.add(byRole.id);
    selectedUsers.set(desired.slot, byRole);
  }

  const masterUser = selectedUsers.get('master');
  const adminUser = selectedUsers.get('admin');
  const pmUser = selectedUsers.get('pm');
  const techUser = selectedUsers.get('tech');
  const residentUser = selectedUsers.get('resident');

  if (!masterUser || !adminUser || !pmUser || !techUser || !residentUser) {
    throw new Error('Failed to resolve the pilot user set.');
  }

  const keepUserIds = [masterUser.id, adminUser.id, pmUser.id, techUser.id, residentUser.id];
  const deleteUsers = existingUsers.filter((user) => !keepUserIds.includes(user.id));
  const deleteUserIds = deleteUsers.map((user) => user.id);
  const deleteResidentIds = deleteUsers
    .map((user) => user.resident?.id)
    .filter((residentId): residentId is number => typeof residentId === 'number');

  const passwordHashes = new Map<DesiredUser['slot'], string>();
  for (const desired of desiredUsers) {
    passwordHashes.set(desired.slot, await hashPassword(desired.password));
  }

  await prisma.$transaction(async (tx) => {
    await tx.voteResponse.deleteMany();
    await tx.voteOption.deleteMany();
    await tx.vote.deleteMany();
    await tx.scheduledTask.deleteMany();
    await tx.workSchedule.deleteMany();
    await tx.ticketComment.deleteMany();
    await tx.communication.deleteMany();
    await tx.notification.deleteMany();
    await tx.maintenanceTeamMember.deleteMany();
    await tx.maintenanceHistory.deleteMany();
    await tx.maintenanceSchedule.deleteMany();
    await tx.approvalTask.deleteMany();
    await tx.activityLog.deleteMany();
    await tx.impersonationEvent.deleteMany();
    await tx.documentShare.deleteMany();
    await tx.document.deleteMany();
    await tx.webhookEvent.deleteMany();
    await tx.refund.deleteMany();
    await tx.providerTransaction.deleteMany();
    await tx.ledgerEntry.deleteMany();
    await tx.paymentIntent.deleteMany();
    await tx.paymentMethod.deleteMany();
    await tx.recurringInvoice.deleteMany();
    await tx.invoice.deleteMany();
    await tx.workOrder.deleteMany();
    await tx.ticket.deleteMany();
    await tx.expense.deleteMany();
    await tx.budget.deleteMany();
    await tx.contract.deleteMany();
    await tx.supplier.deleteMany();

    await tx.user.update({
      where: { id: masterUser.id },
      data: {
        email: desiredUsers[0].email,
        role: desiredUsers[0].role,
        passwordHash: passwordHashes.get('master')!,
        tenantId: DEFAULT_TENANT_ID,
        phone: desiredUsers[0].phone,
        refreshTokenHash: null,
      },
    });

    await tx.user.update({
      where: { id: adminUser.id },
      data: {
        email: desiredUsers[1].email,
        role: desiredUsers[1].role,
        passwordHash: passwordHashes.get('admin')!,
        tenantId: DEFAULT_TENANT_ID,
        phone: desiredUsers[1].phone,
        refreshTokenHash: null,
      },
    });

    await tx.user.update({
      where: { id: pmUser.id },
      data: {
        email: desiredUsers[2].email,
        role: desiredUsers[2].role,
        passwordHash: passwordHashes.get('pm')!,
        tenantId: DEFAULT_TENANT_ID,
        phone: desiredUsers[2].phone,
        refreshTokenHash: null,
      },
    });

    await tx.user.update({
      where: { id: techUser.id },
      data: {
        email: desiredUsers[3].email,
        role: desiredUsers[3].role,
        passwordHash: passwordHashes.get('tech')!,
        tenantId: DEFAULT_TENANT_ID,
        phone: desiredUsers[3].phone,
        refreshTokenHash: null,
      },
    });

    await tx.user.update({
      where: { id: residentUser.id },
      data: {
        email: desiredUsers[4].email,
        role: desiredUsers[4].role,
        passwordHash: passwordHashes.get('resident')!,
        tenantId: DEFAULT_TENANT_ID,
        phone: desiredUsers[4].phone,
        refreshTokenHash: null,
      },
    });

    if (deleteUserIds.length > 0) {
      await tx.buildingCode.updateMany({
        where: {
          createdBy: {
            in: deleteUserIds,
          },
        },
        data: {
          createdBy: adminUser.id,
        },
      });
    }

    if (deleteResidentIds.length > 0) {
      await tx.resident.deleteMany({
        where: {
          id: {
            in: deleteResidentIds,
          },
        },
      });
    }

    if (deleteUserIds.length > 0) {
      await tx.user.deleteMany({
        where: {
          id: {
            in: deleteUserIds,
          },
        },
      });
    }

    const resident = await tx.resident.upsert({
      where: { userId: residentUser.id },
      update: {
        autopayEnabled: true,
        autopayConsentAt: daysAgo(20, 11, 0),
      },
      create: {
        userId: residentUser.id,
        autopayEnabled: true,
        autopayConsentAt: daysAgo(20, 11, 0),
      },
    });

    await tx.unit.update({
      where: { id: pilotUnit.id },
      data: {
        residents: {
          set: [{ id: resident.id }],
        },
      },
    });

    const supplier = await tx.supplier.create({
      data: {
        name: 'צוות אחזקה פיילוט',
        skills: ['אינסטלציה', 'חשמל', 'תחזוקת מבנה'],
        rating: 4.8,
        contactName: 'יואב לוי',
        email: 'tech@demo.com',
        phone: '050-4000003',
        isActive: true,
        complianceNotes: 'ספק מאושר לצורך הדגמת פיילוט.',
        userId: techUser.id,
      },
    });

    const budget = await tx.budget.create({
      data: {
        buildingId: building.id,
        name: 'תקציב פיילוט 2026',
        year: 2026,
        amount: 48000,
        actualSpent: 19350,
        warningThresholdPercent: 80,
        approvalThresholdPercent: 100,
        status: BudgetStatus.ACTIVE,
        notes: 'תקציב הדגמה למעקב הוצאות, תשלומים ואישורים.',
      },
    });

    const approvedExpense = await tx.expense.create({
      data: {
        buildingId: building.id,
        budgetId: budget.id,
        category: ExpenseCategory.MAINTENANCE,
        amount: 1850,
        description: 'החלפת מצוף בבור הביוב והשלמת בדיקת אטימות.',
        incurredAt: daysAgo(6, 10, 30),
        status: ExpenseStatus.APPROVED,
        approvedById: adminUser.id,
        approvedAt: daysAgo(5, 14, 0),
      },
    });

    const pendingExpense = await tx.expense.create({
      data: {
        buildingId: building.id,
        budgetId: budget.id,
        category: ExpenseCategory.MAINTENANCE,
        amount: 1420,
        description: 'החלפת גוף תאורה בכניסה והתקנת חיישן חדש.',
        incurredAt: daysAgo(1, 16, 45),
        status: ExpenseStatus.PENDING,
      },
    });

    const contract = await tx.contract.create({
      data: {
        buildingId: building.id,
        supplierId: supplier.id,
        ownerUserId: pmUser.id,
        title: 'חוזה שירות תחזוקה שוטפת',
        description: 'חוזה חצי שנתי לטיפול בתקלות שבר, סיורי תחזוקה ובדיקות יזומות.',
        value: 12000,
        startDate: daysAgo(45, 9, 0),
        endDate: daysFromNow(18, 18, 0),
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
        approvedAt: daysAgo(44, 12, 0),
      },
    });

    const paymentMethod = await tx.paymentMethod.create({
      data: {
        residentId: resident.id,
        provider: 'tranzila',
        token: 'pilot-card-token-101',
        brand: 'ויזה',
        last4: '4242',
        expMonth: 12,
        expYear: 2028,
        networkTokenized: true,
        isDefault: true,
      },
    });

    const paidInvoice = await tx.invoice.create({
      data: {
        residentId: resident.id,
        items: [
          { description: 'ועד בית פברואר 2026', amount: 460 },
          { description: 'דמי ניקיון חודשיים', amount: 90 },
        ] as any,
        amount: 550,
        status: InvoiceStatus.PAID,
        dueDate: daysAgo(20, 23, 59),
        lateFeeAmount: 0,
        reminderState: InvoiceReminderState.NONE,
        collectionStatus: CollectionStatus.RESOLVED,
        collectionNotes: 'החיוב שולם במלואו דרך כרטיס שמור.',
        createdAt: daysAgo(34, 9, 15),
      },
    });

    const overdueInvoice = await tx.invoice.create({
      data: {
        residentId: resident.id,
        items: [
          { description: 'ועד בית מרץ 2026', amount: 460 },
          { description: 'קרן תחזוקה חד-פעמית', amount: 120 },
        ] as any,
        amount: 580,
        status: InvoiceStatus.UNPAID,
        dueDate: daysAgo(4, 23, 59),
        lateFeeAmount: 35,
        reminderState: InvoiceReminderState.SENT,
        collectionStatus: CollectionStatus.PAST_DUE,
        collectionNotes: 'הדייר ביקש דחייה קצרה עד סוף השבוע.',
        lastReminderAt: daysAgo(2, 10, 0),
        promiseToPayDate: daysFromNow(3, 18, 0),
        createdAt: daysAgo(18, 9, 0),
      },
    });

    const paidIntent = await tx.paymentIntent.create({
      data: {
        invoiceId: paidInvoice.id,
        amount: 550,
        grossAmount: 550,
        providerFeeEstimated: 8.5,
        providerFeeActual: 8.2,
        netAmount: 541.8,
        currency: 'NIS',
        status: PaymentIntentStatus.SUCCEEDED,
        provider: 'tranzila',
        providerIntentId: 'pilot-paid-intent-001',
        paymentMethodId: paymentMethod.id,
        idempotencyKey: 'pilot-paid-001',
        metadata: {
          source: 'pilot-seed',
          note: 'תשלום הדגמה שהושלם בהצלחה',
        } as any,
        createdAt: daysAgo(16, 8, 30),
      },
    });

    await tx.providerTransaction.create({
      data: {
        paymentIntentId: paidIntent.id,
        provider: 'tranzila',
        type: 'capture',
        status: 'SUCCESS',
        code: '000',
        raw: {
          note: 'חיוב פיילוט אושר ונלכד במלואו',
        } as any,
        createdAt: daysAgo(16, 8, 31),
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          invoiceId: paidInvoice.id,
          entryType: 'charge',
          amount: 550,
          debit: 'Accounts Receivable',
          credit: 'Revenue',
          createdAt: daysAgo(34, 9, 15),
        },
        {
          invoiceId: paidInvoice.id,
          paymentIntentId: paidIntent.id,
          entryType: 'payment',
          amount: 550,
          debit: 'Cash',
          credit: 'Accounts Receivable',
          createdAt: daysAgo(16, 8, 31),
        },
        {
          invoiceId: paidInvoice.id,
          paymentIntentId: paidIntent.id,
          entryType: 'fee',
          amount: 8.2,
          debit: 'Payment Processing Fees',
          credit: 'Cash',
          createdAt: daysAgo(16, 8, 31),
        },
        {
          invoiceId: overdueInvoice.id,
          entryType: 'charge',
          amount: 580,
          debit: 'Accounts Receivable',
          credit: 'Revenue',
          createdAt: daysAgo(18, 9, 0),
        },
        {
          invoiceId: overdueInvoice.id,
          entryType: 'late_fee',
          amount: 35,
          debit: 'Accounts Receivable',
          credit: 'Late Fee Revenue',
          createdAt: daysAgo(3, 9, 0),
        },
      ],
    });

    await tx.recurringInvoice.create({
      data: {
        residentId: resident.id,
        title: 'חיוב ועד בית חודשי',
        items: [
          { description: 'ועד בית חודשי קבוע', amount: 460 },
        ] as any,
        amount: 460,
        recurrence: 'monthly',
        autopayEnabled: true,
        dueDaysAfterIssue: 10,
        graceDays: 2,
        lateFeeAmount: 35,
        nextRunAt: daysFromNow(12, 7, 0),
        lastRunAt: daysAgo(18, 7, 0),
        active: true,
      },
    });

    const openTicket = await tx.ticket.create({
      data: {
        unitId: pilotUnit.id,
        severity: TicketSeverity.HIGH,
        status: TicketStatus.IN_PROGRESS,
        assignedToId: techUser.id,
        slaDue: daysFromNow(1, 13, 0),
        photos: [],
        createdAt: daysAgo(1, 8, 20),
      },
    });

    const resolvedTicket = await tx.ticket.create({
      data: {
        unitId: pilotUnit.id,
        severity: TicketSeverity.NORMAL,
        status: TicketStatus.RESOLVED,
        assignedToId: techUser.id,
        slaDue: daysAgo(9, 12, 0),
        photos: [],
        createdAt: daysAgo(10, 9, 0),
      },
    });

    await tx.ticketComment.createMany({
      data: [
        {
          ticketId: openTicket.id,
          authorId: residentUser.id,
          content:
            'קטגוריה: אינסטלציה\nאיש קשר: דייר 101 · 050-4000004\nיש נזילת מים מתחת לכיור במטבח מאז הלילה ויש רטיבות בארון.',
          createdAt: daysAgo(1, 8, 25),
        },
        {
          ticketId: openTicket.id,
          authorId: techUser.id,
          content: 'הגעתי לבניין, זיהיתי אטם שחוק והתחלתי בהחלפה. אעדכן עם סיום העבודה.',
          createdAt: daysAgo(1, 11, 10),
        },
        {
          ticketId: openTicket.id,
          authorId: pmUser.id,
          content: 'נא לתעד עלות חומרים ולוודא שאין רטיבות חוזרת בארון השירות.',
          createdAt: daysAgo(1, 11, 45),
        },
        {
          ticketId: resolvedTicket.id,
          authorId: residentUser.id,
          content:
            'קטגוריה: חשמל\nאיש קשר: דייר 101 · 050-4000004\nנורה בכניסה לבניין לא עבדה במשך יומיים.',
          createdAt: daysAgo(10, 9, 5),
        },
        {
          ticketId: resolvedTicket.id,
          authorId: techUser.id,
          content: 'הוחלף גוף תאורה ונבדקה פעולה תקינה של החיישן. התקלה נסגרה.',
          createdAt: daysAgo(9, 10, 0),
        },
      ],
    });

    const openWorkOrder = await tx.workOrder.create({
      data: {
        ticketId: openTicket.id,
        supplierId: supplier.id,
        costEstimate: 980,
        laborCost: 550,
        materialCost: 190,
        equipmentCost: 0,
        tax: 126,
        totalCost: 866,
        costNotes: 'הערכת עלות להחלפת אטם, בדיקת ארון וייבוש ראשוני.',
        status: WorkOrderStatus.IN_PROGRESS,
        approvedById: adminUser.id,
        approvedAt: daysAgo(1, 10, 30),
        scheduledStart: daysAgo(1, 10, 0),
        scheduledEnd: daysFromNow(0, 16, 0),
        photos: [],
        createdAt: daysAgo(1, 9, 30),
      },
    });

    await tx.workOrder.create({
      data: {
        ticketId: resolvedTicket.id,
        supplierId: supplier.id,
        costEstimate: 420,
        laborCost: 220,
        materialCost: 80,
        equipmentCost: 0,
        tax: 51,
        totalCost: 351,
        costNotes: 'החלפת גוף תאורה וחיישן תנועה.',
        status: WorkOrderStatus.COMPLETED,
        approvedById: adminUser.id,
        approvedAt: daysAgo(9, 9, 30),
        scheduledStart: daysAgo(9, 10, 0),
        scheduledEnd: daysAgo(9, 11, 0),
        completedAt: daysAgo(9, 10, 55),
        photos: [],
        createdAt: daysAgo(9, 9, 0),
      },
    });

    const maintenanceSchedule = await tx.maintenanceSchedule.create({
      data: {
        buildingId: building.id,
        title: 'בדיקת משאבת ביוב תקופתית',
        description: 'בדיקה יזומה של המשאבה בבור השירות, כולל ניקוי מסנן ובדיקת התרעות.',
        category: MaintenanceCategory.PLUMBING,
        type: MaintenanceType.INSPECTION,
        frequency: 'חודשי',
        recurrenceRule: 'FREQ=MONTHLY;INTERVAL=1',
        startDate: daysAgo(25, 9, 0),
        nextOccurrence: daysFromNow(4, 9, 30),
        assignedToId: techUser.id,
        priority: MaintenancePriority.MEDIUM,
        estimatedCost: 450,
        lastCompleted: daysAgo(26, 10, 0),
        completionNotes: 'הבדיקה האחרונה הושלמה ללא חריגות.',
        completionVerified: true,
        verifiedById: pmUser.id,
        verifiedAt: daysAgo(26, 12, 0),
      },
    });

    await tx.maintenanceHistory.create({
      data: {
        scheduleId: maintenanceSchedule.id,
        performedAt: daysAgo(26, 10, 0),
        notes: 'נוקה מסנן המשאבה, נבדקה פעולת מצוף, ולא נמצאה חריגה.',
        cost: 320,
        performedById: techUser.id,
        verified: true,
        verifiedById: pmUser.id,
        verifiedAt: daysAgo(26, 12, 0),
        verificationNotes: 'הבדיקה אומתה והוגדרה כתקינה.',
        createdAt: daysAgo(26, 10, 15),
      },
    });

    const workSchedule = await tx.workSchedule.create({
      data: {
        date: daysFromNow(1, 8, 0),
        buildingId: building.id,
        title: 'לו״ז תפעול יומי',
        description: 'יום עבודה להשלמת תיקון הנזילה, סיור קצר ובדיקת משאבה.',
        createdBy: pmUser.id,
        status: ScheduleStatus.PUBLISHED,
        publishedAt: daysAgo(0, 18, 0),
        createdAt: daysAgo(0, 17, 30),
      },
    });

    await tx.scheduledTask.createMany({
      data: [
        {
          scheduleId: workSchedule.id,
          assignedTo: techUser.id,
          taskType: TaskType.REPAIR,
          title: 'השלמת תיקון נזילה ביחידה 101',
          description: 'בדיקה סופית של האטם, ייבוש הארון ותיעוד עלות.',
          location: `${building.name} · יחידה ${pilotUnit.number}`,
          estimatedTime: 90,
          priority: 'HIGH',
          status: TaskStatus.IN_PROGRESS,
          startTime: daysFromNow(1, 9, 0),
          endTime: daysFromNow(1, 10, 30),
          actualStart: daysFromNow(1, 9, 5),
          ticketId: openTicket.id,
          workOrderId: openWorkOrder.id,
          order: 1,
          createdAt: daysAgo(0, 17, 35),
        },
        {
          scheduleId: workSchedule.id,
          assignedTo: techUser.id,
          taskType: TaskType.INSPECTION,
          title: 'בדיקת משאבת ביוב',
          description: 'מעבר קצר על המשאבה והצלבת נתונים מול בדיקה קודמת.',
          location: `${building.name} · חדר משאבות`,
          estimatedTime: 45,
          priority: 'MEDIUM',
          status: TaskStatus.PENDING,
          startTime: daysFromNow(1, 11, 0),
          endTime: daysFromNow(1, 11, 45),
          order: 2,
          createdAt: daysAgo(0, 17, 36),
        },
      ],
    });

    const requestKey = 'pilot-request-contact-update';
    await tx.communication.createMany({
      data: [
        {
          buildingId: building.id,
          unitId: pilotUnit.id,
          senderId: residentUser.id,
          recipientId: adminUser.id,
          subject: 'CONTACT_UPDATE: עדכון פרטי קשר',
          message: 'אבקש לעדכן מספר טלפון חלופי ולהוסיף כתובת דוא״ל לקבלת חיובים.',
          channel: 'REQUEST',
          metadata: {
            requestKey,
            status: 'IN_REVIEW',
            requestType: 'CONTACT_UPDATE',
            requestedDate: daysFromNow(2, 12, 0).toISOString(),
            statusNotes: 'הבקשה נבדקת מול משרד הניהול.',
          } as any,
          createdAt: daysAgo(2, 9, 0),
        },
        {
          buildingId: building.id,
          unitId: pilotUnit.id,
          senderId: residentUser.id,
          recipientId: pmUser.id,
          subject: 'CONTACT_UPDATE: עדכון פרטי קשר',
          message: 'אבקש לעדכן מספר טלפון חלופי ולהוסיף כתובת דוא״ל לקבלת חיובים.',
          channel: 'REQUEST',
          metadata: {
            requestKey,
            status: 'IN_REVIEW',
            requestType: 'CONTACT_UPDATE',
            requestedDate: daysFromNow(2, 12, 0).toISOString(),
            statusNotes: 'הבקשה נבדקת מול משרד הניהול.',
          } as any,
          createdAt: daysAgo(2, 9, 1),
        },
        {
          buildingId: building.id,
          unitId: pilotUnit.id,
          senderId: residentUser.id,
          recipientId: masterUser.id,
          subject: 'CONTACT_UPDATE: עדכון פרטי קשר',
          message: 'אבקש לעדכן מספר טלפון חלופי ולהוסיף כתובת דוא״ל לקבלת חיובים.',
          channel: 'REQUEST',
          metadata: {
            requestKey,
            status: 'IN_REVIEW',
            requestType: 'CONTACT_UPDATE',
            requestedDate: daysFromNow(2, 12, 0).toISOString(),
            statusNotes: 'הבקשה נבדקת מול משרד הניהול.',
          } as any,
          createdAt: daysAgo(2, 9, 2),
        },
      ],
    });

    const batchKey = 'pilot-announcement-april-cleaning';
    await tx.communication.create({
      data: {
        buildingId: building.id,
        senderId: pmUser.id,
        recipientId: residentUser.id,
        subject: 'עדכון עבודות ניקיון לשבוע הקרוב',
        message: 'ביום רביעי יתבצע ניקוי יסודי בלובי ובחדר המדרגות בין 09:00 ל-12:00.',
        channel: 'ANNOUNCEMENT',
        metadata: {
          priority: 'HIGH',
          recipientRole: 'RESIDENT',
          batchKey,
        } as any,
        createdAt: daysAgo(3, 13, 0),
      },
    });

    await tx.communication.create({
      data: {
        buildingId: building.id,
        unitId: pilotUnit.id,
        senderId: adminUser.id,
        recipientId: residentUser.id,
        subject: 'עדכון סטטוס טיפול בנזילה',
        message: 'הטכנאי מטפל כעת בתקלה. אם תתגלה רטיבות נוספת, נא לעדכן דרך האפליקציה.',
        channel: 'PORTAL',
        createdAt: daysAgo(1, 12, 15),
      },
    });

    await tx.notification.createMany({
      data: [
        {
          tenantId: DEFAULT_TENANT_ID,
          userId: residentUser.id,
          buildingId: building.id,
          title: 'תזכורת לתשלום פתוח',
          message: 'נותרה יתרה פתוחה בסך 580 ש״ח עבור מרץ 2026.',
          type: 'PAYMENT_REMINDER',
          metadata: { invoiceId: overdueInvoice.id } as any,
          createdAt: daysAgo(2, 10, 0),
        },
        {
          tenantId: DEFAULT_TENANT_ID,
          userId: techUser.id,
          buildingId: building.id,
          title: 'קריאה שובצה אליך',
          message: 'דליפת מים ביחידה 101 שובצה לטיפולך ונמצאת כעת בעבודה.',
          type: 'TICKET_ASSIGNED',
          metadata: { ticketId: openTicket.id } as any,
          createdAt: daysAgo(1, 9, 35),
        },
        {
          tenantId: DEFAULT_TENANT_ID,
          userId: pmUser.id,
          buildingId: building.id,
          title: 'בקשת דייר בטיפול',
          message: 'בקשת עדכון פרטי קשר סומנה כבטיפול וממתינה לאימות.',
          type: 'RESIDENT_REQUEST',
          metadata: { requestKey } as any,
          createdAt: daysAgo(2, 9, 5),
        },
        {
          tenantId: DEFAULT_TENANT_ID,
          userId: adminUser.id,
          buildingId: building.id,
          title: 'אישור הוצאה ממתין',
          message: 'נדרש אישור להוצאה על תאורת הכניסה בסך 1,420 ש״ח.',
          type: 'APPROVAL_TASK',
          metadata: { expenseId: pendingExpense.id } as any,
          createdAt: daysAgo(1, 17, 0),
        },
        {
          tenantId: DEFAULT_TENANT_ID,
          userId: masterUser.id,
          buildingId: building.id,
          title: 'סביבת פיילוט מוכנה',
          message: 'נתוני הפיילוט אופסו ונבנו מחדש עם משתמש אחד לכל תפקיד.',
          type: 'SYSTEM',
          metadata: { buildingId: building.id } as any,
          createdAt: daysAgo(0, 8, 0),
        },
      ],
    });

    await tx.approvalTask.createMany({
      data: [
        {
          type: ApprovalTaskType.EXPENSE_APPROVAL,
          status: ApprovalTaskStatus.PENDING,
          entityType: 'EXPENSE',
          entityId: pendingExpense.id,
          buildingId: building.id,
          residentId: resident.id,
          requestedById: pmUser.id,
          title: 'אישור הוצאה לתאורת כניסה',
          description: 'החלפת גוף תאורה וחיישן בכניסה הראשית.',
          reason: 'התקלה משפיעה על בטיחות הדיירים בשעות הערב.',
          metadata: { amount: pendingExpense.amount } as any,
          createdAt: daysAgo(1, 16, 50),
        },
        {
          type: ApprovalTaskType.WORK_ORDER_APPROVAL,
          status: ApprovalTaskStatus.APPROVED,
          entityType: 'WORK_ORDER',
          entityId: openWorkOrder.id,
          buildingId: building.id,
          residentId: resident.id,
          requestedById: techUser.id,
          decidedById: adminUser.id,
          title: 'אישור הזמנת עבודה לנזילה ביחידה 101',
          description: 'הזמנת עבודה לטיפול בנזילה מתחת לכיור.',
          reason: 'נדרש טיפול מהיר כדי למנוע נזק לארון ולריצוף.',
          metadata: { amount: openWorkOrder.costEstimate } as any,
          decidedAt: daysAgo(1, 10, 30),
          createdAt: daysAgo(1, 9, 40),
        },
      ],
    });

    await tx.activityLog.createMany({
      data: [
        {
          userId: residentUser.id,
          buildingId: building.id,
          residentId: resident.id,
          entityType: 'INVOICE',
          entityId: overdueInvoice.id,
          action: 'PAYMENT_REMINDER_SENT',
          summary: 'נשלחה לדייר תזכורת לגבי יתרה פתוחה לחודש מרץ.',
          severity: ActivitySeverity.WARNING,
          metadata: { amount: overdueInvoice.amount } as any,
          createdAt: daysAgo(2, 10, 0),
        },
        {
          userId: residentUser.id,
          buildingId: building.id,
          residentId: resident.id,
          entityType: 'RESIDENT_REQUEST',
          action: 'REQUEST_CREATED',
          summary: 'הדייר פתח בקשה לעדכון פרטי קשר.',
          severity: ActivitySeverity.INFO,
          metadata: { requestKey } as any,
          createdAt: daysAgo(2, 9, 0),
        },
        {
          userId: pmUser.id,
          buildingId: building.id,
          residentId: resident.id,
          entityType: 'RESIDENT_REQUEST',
          action: 'REQUEST_STATUS_UPDATED',
          summary: 'סטטוס בקשת הדייר עודכן ל״בטיפול״.',
          severity: ActivitySeverity.INFO,
          metadata: { requestKey, status: 'IN_REVIEW' } as any,
          createdAt: daysAgo(2, 11, 30),
        },
        {
          userId: residentUser.id,
          buildingId: building.id,
          residentId: resident.id,
          entityType: 'TICKET',
          entityId: openTicket.id,
          action: 'TICKET_CREATED',
          summary: 'נפתחה קריאת אינסטלציה עבור נזילה במטבח ביחידה 101.',
          severity: ActivitySeverity.WARNING,
          metadata: { severity: openTicket.severity } as any,
          createdAt: daysAgo(1, 8, 20),
        },
        {
          userId: techUser.id,
          buildingId: building.id,
          residentId: resident.id,
          entityType: 'TICKET',
          entityId: openTicket.id,
          action: 'TICKET_STATUS_CHANGED',
          summary: 'הטכנאי החל טיפול פעיל בנזילה ביחידה 101.',
          severity: ActivitySeverity.INFO,
          metadata: { status: openTicket.status } as any,
          createdAt: daysAgo(1, 11, 10),
        },
        {
          userId: adminUser.id,
          buildingId: building.id,
          residentId: resident.id,
          entityType: 'WORK_ORDER',
          entityId: openWorkOrder.id,
          action: 'WORK_ORDER_APPROVED',
          summary: 'אושרה הזמנת העבודה לטיפול בנזילה.',
          severity: ActivitySeverity.INFO,
          metadata: { workOrderId: openWorkOrder.id } as any,
          createdAt: daysAgo(1, 10, 30),
        },
        {
          userId: techUser.id,
          buildingId: building.id,
          entityType: 'MAINTENANCE',
          entityId: maintenanceSchedule.id,
          action: 'MAINTENANCE_COMPLETED',
          summary: 'הושלמה בדיקת משאבת ביוב תקופתית ללא חריגות.',
          severity: ActivitySeverity.INFO,
          metadata: { scheduleId: maintenanceSchedule.id } as any,
          createdAt: daysAgo(26, 10, 15),
        },
        {
          userId: pmUser.id,
          buildingId: building.id,
          entityType: 'ANNOUNCEMENT',
          action: 'ANNOUNCEMENT_CREATED',
          summary: 'נשלחה הודעת תחזוקה לדיירי הבניין לגבי עבודות ניקיון.',
          severity: ActivitySeverity.INFO,
          metadata: { batchKey } as any,
          createdAt: daysAgo(3, 13, 0),
        },
        {
          userId: adminUser.id,
          buildingId: building.id,
          entityType: 'EXPENSE',
          entityId: approvedExpense.id,
          action: 'EXPENSE_APPROVED',
          summary: 'אושרה הוצאה על החלפת מצוף ובדיקת אטימות.',
          severity: ActivitySeverity.INFO,
          metadata: { amount: approvedExpense.amount } as any,
          createdAt: daysAgo(5, 14, 0),
        },
        {
          userId: masterUser.id,
          buildingId: building.id,
          entityType: 'SYSTEM',
          action: 'PILOT_SEED_REFRESHED',
          summary: 'סביבת הפיילוט רועננה עם משתמש אחד לכל תפקיד ונתוני הדגמה בעברית.',
          severity: ActivitySeverity.INFO,
          metadata: { contractId: contract.id } as any,
          createdAt: daysAgo(0, 8, 0),
        },
      ],
    });
  }, {
    maxWait: 30_000,
    timeout: 120_000,
  });

  const [usersByRole, counts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { role: 'asc' },
      select: { id: true, email: true, role: true },
    }),
    Promise.all([
      prisma.ticket.count(),
      prisma.invoice.count(),
      prisma.communication.count(),
      prisma.notification.count(),
      prisma.activityLog.count(),
      prisma.approvalTask.count(),
      prisma.workOrder.count(),
      prisma.maintenanceSchedule.count(),
    ]),
  ]);

  console.log('Pilot remote seed completed.');
  console.table(usersByRole);
  console.log(
    JSON.stringify(
      {
        buildingPreserved: PILOT_BUILDING_ADDRESS,
        counts: {
          tickets: counts[0],
          invoices: counts[1],
          communications: counts[2],
          notifications: counts[3],
          activityLogs: counts[4],
          approvalTasks: counts[5],
          workOrders: counts[6],
          maintenanceSchedules: counts[7],
        },
      },
      null,
      2,
    ),
  );
  console.log('Passwords: master@demo.com -> master123, all other pilot users -> password123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
