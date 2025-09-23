import {
  PrismaClient,
  Role,
  TicketSeverity,
  TicketStatus,
  MaintenanceCategory,
  MaintenanceType,
  BudgetStatus,
  ExpenseCategory,
} from '.prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding should not run in production');
  }

  // wipe existing data for idempotency
  await prisma.$transaction([
    prisma.communication.deleteMany(),
    prisma.maintenanceSchedule.deleteMany(),
    prisma.document.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.workOrder.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.resident.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.building.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.user.deleteMany({ where: { role: { not: Role.MASTER } } }),
  ]);

  const credentials: { email: string; password: string; role: Role }[] = [];
  const defaultPassword = 'password123';
  const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);

  // master user for DEV
  const masterPassword = 'master123';
  const masterHash = await bcrypt.hash(masterPassword, 10);
  const master = await prisma.user.upsert({
    where: { email: 'master@demo.com' },
    update: { passwordHash: masterHash, role: Role.MASTER, tenantId: 1 },
    create: {
      email: 'master@demo.com',
      passwordHash: masterHash,
      role: Role.MASTER,
      tenantId: 1,
    },
  });
  credentials.push({ email: master.email, password: masterPassword, role: Role.MASTER });

  // demo users
  const users = [
    { email: 'amit.magen@demo.com', role: Role.ADMIN },
    { email: 'or.peretz@demo.com', role: Role.ADMIN },
    { email: 'maya@demo.com', role: Role.PM },
    { email: 'client@demo.com', role: Role.RESIDENT },
    { email: 'tech1@demo.com', role: Role.TECH },
    { email: 'tech2@demo.com', role: Role.TECH },
    { email: 'tech3@demo.com', role: Role.TECH },
  ];

  const createdUsers: Record<string, { id: number }> = {};
  for (const u of users) {
    const user = await prisma.user.create({
      data: { email: u.email, passwordHash: defaultPasswordHash, role: u.role, tenantId: 1 },
    });
    createdUsers[u.email] = { id: user.id };
    credentials.push({ email: u.email, password: defaultPassword, role: u.role });
  }

  // resident profile for demo client
  const resident = await prisma.resident.create({
    data: { userId: createdUsers['client@demo.com'].id },
  });

  // buildings dataset
  const buildingLabels = [
    'אפרים קישון 5, הרצליה',
    'אמה טאובר 9, הרצליה',
    'אפריים קישון 24, הרצליה',
    'אפריים קישון 26, הרצליה',
    'אפריים קישון 28, הרצליה',
    'אריאל 5, הרצליה',
    'הדר 38, הרצליה',
    'בר אילן 20, הרצליה',
    'רבקה גרובר 3, הרצליה',
    'דוד שמעוני 12, הרצליה',
    'דוד שמעוני 16, הרצליה',
    'דוד שמעוני 26, הרצליה',
    'דוד שמעוני 28, הרצליה',
    'דורי 17, הרצליה',
    'דורי 19, הרצליה',
    'י.ל.ברוך 22, הרצליה',
    'דליה רביקוביץ 5, רעננה',
    'דליה רביקוביץ 7, רעננה',
    'דליה רביקוביץ 8, הרצליה',
    'דליה רביקוביץ 10, הרצליה',
    'דליה רביקוביץ 12, הרצליה',
    'דליה רביקוביץ 14, הרצליה',
    'האוניברסיטה 1, הרצליה',
    'האוניברסיטה 3, הרצליה',
    'האוניברסיטה 5, הרצליה',
    'האסיף 6, הרצליה',
    'הדר 40, הרצליה',
    'הדר 42, הרצליה',
    'הקרן 6, הרצליה',
    'הקרן 8, הרצליה',
    'זלמן שניאור 21, הרצליה',
    'זלמן שניאור 23, הרצליה',
    'זלמן שניאור 25, הרצליה',
    'חובת הלבבות 3, הרצליה',
    'חובת הלבבות 9, הרצליה',
    'חנה רובינא 3, הרצליה',
    'חנה רובינא 5, הרצליה',
    'חנה רובינא 7, הרצליה',
    'חנה רובינא 9, הרצליה',
    'חנה רובינא 13, הרצליה',
    'חנה רובינא 19, הרצליה',
    'חנה רובינא 40, הרצליה',
    'חנה רובינא 42, הרצליה',
    'חנה רובינא 44, הרצליה',
    'חנה רובינא 46, הרצליה',
    'טשרניחובסקי 10, הרצליה',
    'יגאל אלון 4, הרצליה',
    'יגאל אלון 40, הרצליה',
    'יהודה עמיחי 6, רעננה',
    'יהודה עמיחי 16, רעננה',
    'יהודה הלוי 8, הרצליה',
    'כיבוש העבודה 27, הרצליה',
    'לאה גולדברג 6, הרצליה',
    'לוין 22, הרצליה',
    'מכבי 6א, רעננה',
    'מכבי 6ב, רעננה',
    'יערה 14, רעננה',
    'יערה 16, רעננה',
    'יהודה עמיחי 4, רעננה',
    'נורדאו 2, הרצליה',
    'נעמי שמר 17, רעננה',
    'נעמי שמר 19, רעננה',
    'נתן אלתרמן 12, הרצליה',
    'נתן אלתרמן 14, הרצליה',
    'נתן אלתרמן 42, הרצליה',
    'נתן אלתרמן 44, הרצליה',
    'עינב 20, הרצליה',
    'עזרא הסופר 9, הרצליה',
    'עזרא הסופר 11, הרצליה',
    'עינב 22, הרצליה',
    'צמרות 4-6-8, הרצליה',
    'רחבעם זאבי 1, הרצליה',
    'העלומים 3, הרצליה',
    'בני בנימין 22, הרצליה',
    'בני בנימין 22א, הרצליה',
    'האסיף 2, הרצליה',
    'שדרות חן 2, הרצליה',
    'חובבי ציון 9, הרצליה',
  ];

  const buildings = [] as { id: number }[];
  const now = new Date();
  for (const [index, label] of buildingLabels.entries()) {
    const buildYear = 1980 + (index % 30);
    const floors = 4 + (index % 6);
    const totalUnits = floors * 2;
    const building = await prisma.building.create({
      data: {
        name: label,
        address: label,
        tenantId: 1,
        yearBuilt: buildYear,
        floors,
        totalUnits,
        area: 1200 + index * 15,
        amenities: index % 2 === 0 ? ['חדר כושר', 'חניון'] : ['לובי מפואר', 'מעלית חכמה'],
        managerName: 'צוות ניהול עמית',
        contactEmail: 'support@amit-housing.demo',
        contactPhone: '+972-3-555-0101',
        notes: 'נוצר כחלק מזריעת נתונים לדמו.',
      },
    });
    buildings.push({ id: building.id });
  }

  // unit and tickets for demonstration
  const unit = await prisma.unit.create({
    data: {
      number: '1',
      buildingId: buildings[0].id,
      area: 95,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 1,
      floor: 2,
      residents: { connect: { id: resident.id } },
    },
  });

  const techUsers = [
    createdUsers['tech1@demo.com'].id,
    createdUsers['tech2@demo.com'].id,
    createdUsers['tech3@demo.com'].id,
  ];

  const severities = [
    TicketSeverity.LOW,
    TicketSeverity.MEDIUM,
    TicketSeverity.HIGH,
  ];
  const statuses = [
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.RESOLVED,
  ];

  for (let i = 0; i < 3; i++) {
    await prisma.ticket.create({
      data: {
        unitId: unit.id,
        severity: severities[i],
        status: statuses[i],
        slaDue: new Date(),
        photos: [],
        assignedToId: techUsers[i],
      },
    });
  }

  // supplier & contracts
  const hvacSupplier = await prisma.supplier.create({
    data: {
      name: 'HVAC Experts Ltd.',
      skills: ['HVAC Maintenance', 'Air Quality'],
      rating: 4.8,
      documents: [],
    },
  });

  const hvacContract = await prisma.contract.create({
    data: {
      buildingId: buildings[0].id,
      supplierId: hvacSupplier.id,
      title: 'HVAC Service Agreement',
      description: 'Annual preventive maintenance for HVAC systems.',
      value: 12000,
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: new Date(now.getFullYear(), 11, 31),
    },
  });

  // assets
  const hvacAsset = await prisma.asset.create({
    data: {
      buildingId: buildings[0].id,
      name: 'Roof HVAC Unit A',
      category: MaintenanceCategory.HVAC,
      description: 'Primary HVAC system for tower A',
      serialNumber: 'HVAC-ROOF-A-001',
      location: 'Roof',
      purchaseDate: new Date(now.getFullYear() - 6, 5, 1),
      warrantyExpiry: new Date(now.getFullYear() + 1, 5, 1),
      status: 'OPERATIONAL',
    },
  });

  const generatorAsset = await prisma.asset.create({
    data: {
      buildingId: buildings[0].id,
      name: 'Backup Generator',
      category: MaintenanceCategory.GENERAL,
      description: 'Diesel backup generator for emergency power.',
      serialNumber: 'GEN-2020-004',
      location: 'Parking level -2',
      purchaseDate: new Date(now.getFullYear() - 4, 8, 15),
      status: 'OPERATIONAL',
    },
  });

  // maintenance schedules
  const hvacSchedule = await prisma.maintenanceSchedule.create({
    data: {
      buildingId: buildings[0].id,
      assetId: hvacAsset.id,
      title: 'HVAC Quarterly Inspection',
      description: 'Quarterly preventive maintenance for HVAC system.',
      category: MaintenanceCategory.HVAC,
      type: MaintenanceType.PREVENTIVE,
      frequency: 'QUARTERLY',
      startDate: now,
      nextOccurrence: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
      assignedToId: techUsers[0],
    },
  });

  await prisma.maintenanceSchedule.create({
    data: {
      buildingId: buildings[0].id,
      assetId: generatorAsset.id,
      title: 'Generator Load Test',
      description: 'Bi-annual generator load testing.',
      category: MaintenanceCategory.GENERAL,
      type: MaintenanceType.INSPECTION,
      frequency: 'BI_ANNUAL',
      startDate: new Date(now.getFullYear(), 0, 15),
      nextOccurrence: new Date(now.getFullYear(), 6, 15),
      assignedToId: techUsers[1],
    },
  });

  // budgets & expenses
  const operatingBudget = await prisma.budget.create({
    data: {
      buildingId: buildings[0].id,
      name: `Operating Budget ${now.getFullYear()}`,
      year: now.getFullYear(),
      amount: 50000,
      status: BudgetStatus.ACTIVE,
      notes: 'Covers general maintenance, utilities and staffing.',
    },
  });

  const hvacExpense = await prisma.expense.create({
    data: {
      buildingId: buildings[0].id,
      budgetId: operatingBudget.id,
      category: ExpenseCategory.MAINTENANCE,
      amount: 1800,
      description: 'HVAC filter replacements and calibration',
      incurredAt: new Date(now.getFullYear(), now.getMonth() - 1, 10),
    },
  });

  const utilityExpense = await prisma.expense.create({
    data: {
      buildingId: buildings[0].id,
      budgetId: operatingBudget.id,
      category: ExpenseCategory.UTILITIES,
      amount: 3200,
      description: 'Electricity bill for common areas',
      incurredAt: new Date(now.getFullYear(), now.getMonth() - 1, 25),
    },
  });

  const totalExpenses = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { budgetId: operatingBudget.id },
  });

  await prisma.budget.update({
    where: { id: operatingBudget.id },
    data: {
      actualSpent: totalExpenses._sum.amount ?? 0,
    },
  });

  // documents
  await prisma.document.create({
    data: {
      buildingId: buildings[0].id,
      name: 'Fire Safety Plan',
      url: 'https://example.com/docs/fire-safety-plan.pdf',
      category: 'safety',
      uploadedById: master.id,
    },
  });

  await prisma.document.create({
    data: {
      contractId: hvacContract.id,
      name: 'HVAC Contract 2024.pdf',
      url: 'https://example.com/docs/hvac-contract-2024.pdf',
      category: 'contract',
      uploadedById: createdUsers['maya@demo.com'].id,
    },
  });

  await prisma.document.create({
    data: {
      assetId: hvacAsset.id,
      name: 'HVAC Maintenance Manual.pdf',
      url: 'https://example.com/docs/hvac-manual.pdf',
      category: 'manual',
      uploadedById: createdUsers['tech1@demo.com'].id,
    },
  });

  await prisma.document.create({
    data: {
      expenseId: hvacExpense.id,
      name: 'HVAC Invoice #INV-231.pdf',
      url: 'https://example.com/docs/hvac-invoice.pdf',
      category: 'invoice',
      uploadedById: createdUsers['maya@demo.com'].id,
    },
  });

  // notifications & communications
  await prisma.notification.createMany({
    data: [
      {
        tenantId: 1,
        buildingId: buildings[0].id,
        userId: createdUsers['client@demo.com'].id,
        title: 'ביקור טכנאי מתוכנן',
        message: 'ב-15 לחודש יתקיים טיפול מנע במערכת המיזוג בבניין.',
        type: 'MAINTENANCE',
      },
      {
        tenantId: 1,
        buildingId: buildings[0].id,
        title: 'עדכון תקציב חודשי',
        message: 'דו"ח התקציב עודכן עם ההוצאות האחרונות.',
        type: 'FINANCE',
      },
    ],
  });

  await prisma.communication.create({
    data: {
      buildingId: buildings[0].id,
      unitId: unit.id,
      senderId: createdUsers['maya@demo.com'].id,
      recipientId: createdUsers['client@demo.com'].id,
      maintenanceScheduleId: hvacSchedule.id,
      subject: 'תיאום תחזוקה לרבעון הקרוב',
      message: 'אנא אשרו כי ניתן לבצע את ביקור הטכנאי ביום שני בשעה 10:00.',
      channel: 'PORTAL',
    },
  });

  await prisma.communication.create({
    data: {
      buildingId: buildings[0].id,
      senderId: createdUsers['tech1@demo.com'].id,
      maintenanceScheduleId: hvacSchedule.id,
      subject: 'דו"ח סיום טיפול',
      message: 'הטיפול במערכת המיזוג הושלם בהצלחה. המסנן הוחלף והמערכת נבדקה.',
      channel: 'INTERNAL',
    },
  });

  console.log('Seed complete. Demo credentials:');
  console.table(
    credentials.map((c) => ({ email: c.email, password: c.password, role: c.role }))
  );
}

main().finally(async () => {
  await prisma.$disconnect();
});

