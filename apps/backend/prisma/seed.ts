import {
  PrismaClient,
  Role,
  TicketSeverity,
  TicketStatus,
  MaintenanceCategory,
  MaintenanceType,
  BudgetStatus,
  ExpenseCategory,
  CodeType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const RUBINA_42_ADDRESS = 'חנה רובינא 42, הרצליה';

const rubinaResidents = [
  {
    firstName: 'רוני',
    lastName: 'זגאייר',
    email: 'zagayer@gmail.com',
    phone: '050-7876348',
    address: 'רובינא 42, הרצליה',
    monthlyFee: 460,
    unitNumber: '101',
    password: 'rubina101',
  },
  {
    firstName: 'ירון',
    lastName: 'חזן',
    email: 'yaron.hazan@intel.com',
    phone: '054-7885982',
    address: 'רובינא 42, הרצליה',
    monthlyFee: 460,
    unitNumber: '102',
    password: 'rubina102',
  },
  {
    firstName: 'כרמל',
    lastName: 'רודה',
    email: 'karmel007@walla.com',
    phone: '053-3680680',
    address: 'רובינא 42, הרצליה',
    monthlyFee: 460,
    unitNumber: '103',
    password: 'rubina103',
  },
  {
    firstName: 'אילן',
    lastName: 'מוריאנו',
    email: 'morianolow@gmail.com',
    phone: '050-5116014',
    address: 'רובינא 42, הרצליה',
    monthlyFee: 460,
    unitNumber: '104',
    password: 'rubina104',
  },
  {
    firstName: 'יעקב',
    lastName: 'קלינסקי',
    email: 'ykalinsky1@gmail.com',
    phone: '052-3579227',
    address: 'רובינא 42, הרצליה',
    monthlyFee: 460,
    unitNumber: '105',
    password: 'rubina105',
  },
  {
    firstName: 'אביב',
    lastName: 'חיים',
    email: 'avivhaim@gmail.com',
    phone: '054-5457087',
    address: 'רובינא 42, הרצליה',
    monthlyFee: 460,
    unitNumber: '106',
    password: 'rubina106',
  },
  {
    firstName: 'גלית',
    lastName: 'אוזן',
    email: 'galitrozenberg@gmail.com',
    phone: '052-7487788',
    address: 'רובינא 42, הרצליה',
    monthlyFee: 521,
    unitNumber: '107',
    password: 'rubina107',
  },
] as const;

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
    prisma.ledgerEntry.deleteMany(),
    prisma.providerTransaction.deleteMany(),
    prisma.refund.deleteMany(),
    prisma.paymentIntent.deleteMany(),
    prisma.paymentMethod.deleteMany(),
    prisma.recurringInvoice.deleteMany(),
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
    { email: 'finance@demo.com', role: Role.ACCOUNTANT },
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
    const isRubina42 = label === RUBINA_42_ADDRESS;
    const building = await prisma.building.create({
      data: {
        name: label,
        address: label,
        tenantId: 1,
        yearBuilt: isRubina42 ? 1996 : buildYear,
        floors: isRubina42 ? 4 : floors,
        totalUnits: isRubina42 ? rubinaResidents.length : totalUnits,
        area: isRubina42 ? 1680 : 1200 + index * 15,
        amenities: isRubina42 ? ['לובי', 'מעלית', 'חניה'] : index % 2 === 0 ? ['חדר כושר', 'חניון'] : ['לובי מפואר', 'מעלית חכמה'],
        managerName: isRubina42 ? 'ועד הבית רובינא 42' : 'צוות ניהול עמית',
        contactEmail: isRubina42 ? 'board-rubina42@demo.local' : 'support@amit-housing.demo',
        contactPhone: isRubina42 ? '09-9554242' : '+972-3-555-0101',
        notes: isRubina42 ? 'בניין seeded עם בעלי הדירות בפועל לצורך בדיקות E2E.' : 'נוצר כחלק מזריעת נתונים לדמו.',
      },
    });
    buildings.push({ id: building.id });
  }

  const rubina42Building = await prisma.building.findFirstOrThrow({
    where: { address: RUBINA_42_ADDRESS, tenantId: 1 },
  });

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
    TicketSeverity.NORMAL,
    TicketSeverity.HIGH,
    TicketSeverity.URGENT,
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

  const recentInvoice = await prisma.invoice.create({
    data: {
      residentId: resident.id,
      items: [
        { description: 'Monthly management fee', quantity: 1, unitPrice: 850 },
        { description: 'Parking fee', quantity: 1, unitPrice: 120 },
      ],
      amount: 970,
      createdAt: new Date(now.getFullYear(), now.getMonth(), 1),
    },
  });

  const overdueInvoice = await prisma.invoice.create({
    data: {
      residentId: resident.id,
      items: [
        { description: 'Utility reimbursement', quantity: 1, unitPrice: 430 },
      ],
      amount: 430,
      createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 5),
    },
  });

  const paidInvoice = await prisma.invoice.create({
    data: {
      residentId: resident.id,
      items: [
        { description: 'Maintenance service charge', quantity: 1, unitPrice: 650 },
      ],
      amount: 650,
      status: 'PAID',
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    },
  });

  const paymentMethod = await prisma.paymentMethod.create({
    data: {
      residentId: resident.id,
      provider: 'tranzila',
      token: 'pm_demo_visa',
      brand: 'Visa',
      last4: '4242',
      expMonth: 12,
      expYear: now.getFullYear() + 2,
      isDefault: true,
    },
  });

  await prisma.paymentIntent.create({
    data: {
      invoiceId: paidInvoice.id,
      amount: paidInvoice.amount,
      currency: 'NIS',
      provider: 'tranzila',
      status: 'SUCCEEDED',
      providerIntentId: `pi_${paidInvoice.id}`,
      paymentMethodId: paymentMethod.id,
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 3),
    },
  });

  await prisma.recurringInvoice.create({
    data: {
      residentId: resident.id,
      items: [
        { description: 'Monthly management fee', quantity: 1, unitPrice: 850 },
      ],
      amount: 850,
      recurrence: 'monthly',
      nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      lastRunAt: new Date(now.getFullYear(), now.getMonth(), 1),
      active: true,
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

  const rubinaBudget = await prisma.budget.create({
    data: {
      buildingId: rubina42Building.id,
      name: `Operating Budget ${now.getFullYear()} - Rubina 42`,
      year: now.getFullYear(),
      amount: 42000,
      status: BudgetStatus.ACTIVE,
      notes: 'Budget sized for Rubina 42 end-to-end testing.',
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        buildingId: rubina42Building.id,
        budgetId: rubinaBudget.id,
        category: ExpenseCategory.UTILITIES,
        amount: 2850,
        description: 'חשמל וניקיון שטחים משותפים',
        incurredAt: new Date(now.getFullYear(), now.getMonth() - 1, 20),
      },
      {
        buildingId: rubina42Building.id,
        budgetId: rubinaBudget.id,
        category: ExpenseCategory.MAINTENANCE,
        amount: 1650,
        description: 'תחזוקת מעלית וקריאת שירות',
        incurredAt: new Date(now.getFullYear(), now.getMonth() - 1, 12),
      },
    ],
  });

  const rubinaAsset = await prisma.asset.create({
    data: {
      buildingId: rubina42Building.id,
      name: 'Rubina 42 Elevator',
      category: MaintenanceCategory.SAFETY,
      description: 'Main passenger elevator for Rubina 42.',
      serialNumber: 'R42-ELEV-001',
      location: 'Lobby',
      purchaseDate: new Date(2019, 4, 1),
      warrantyExpiry: new Date(now.getFullYear() + 1, 4, 1),
      status: 'OPERATIONAL',
    },
  });

  const rubinaSchedule = await prisma.maintenanceSchedule.create({
    data: {
      buildingId: rubina42Building.id,
      assetId: rubinaAsset.id,
      title: 'בדיקת מעלית חודשית',
      description: 'בדיקת תקינות מעלית וארון פיקוד.',
      category: MaintenanceCategory.SAFETY,
      type: MaintenanceType.INSPECTION,
      frequency: 'MONTHLY',
      startDate: now,
      nextOccurrence: new Date(now.getFullYear(), now.getMonth() + 1, 5),
      assignedToId: createdUsers['tech2@demo.com'].id,
    },
  });

  await prisma.document.create({
    data: {
      buildingId: rubina42Building.id,
      name: 'Rubina 42 House Committee Summary.pdf',
      url: 'https://example.com/docs/rubina-42-committee-summary.pdf',
      category: 'committee',
      uploadedById: createdUsers['maya@demo.com'].id,
    },
  });

  await prisma.buildingCode.createMany({
    data: [
      {
        buildingId: rubina42Building.id,
        codeType: CodeType.ENTRANCE,
        code: '4242',
        description: 'Main entrance keypad',
        createdBy: createdUsers['maya@demo.com'].id,
      },
      {
        buildingId: rubina42Building.id,
        codeType: CodeType.ELEVATOR,
        code: '4201',
        description: 'Elevator service mode',
        createdBy: createdUsers['maya@demo.com'].id,
      },
      {
        buildingId: rubina42Building.id,
        codeType: CodeType.WIFI,
        code: 'Rubina42-Residents',
        description: 'Lobby WiFi',
        createdBy: createdUsers['maya@demo.com'].id,
      },
    ],
  });

  for (const [index, residentSeed] of rubinaResidents.entries()) {
    const passwordHash = await bcrypt.hash(residentSeed.password, 10);
    const user = await prisma.user.create({
      data: {
        email: residentSeed.email,
        passwordHash,
        role: Role.RESIDENT,
        tenantId: 1,
        phone: residentSeed.phone,
      },
    });

    credentials.push({ email: residentSeed.email, password: residentSeed.password, role: Role.RESIDENT });

    const residentProfile = await prisma.resident.create({
      data: {
        userId: user.id,
        autopayEnabled: index % 2 === 0,
        autopayConsentAt: index % 2 === 0 ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : null,
      },
    });

    const unit = await prisma.unit.create({
      data: {
        number: residentSeed.unitNumber,
        buildingId: rubina42Building.id,
        floor: Math.ceil((index + 1) / 2),
        area: 92 + index * 3,
        bedrooms: index === rubinaResidents.length - 1 ? 4 : 3,
        bathrooms: 2,
        parkingSpaces: 1,
        residents: { connect: { id: residentProfile.id } },
      },
    });

    const monthlyDescription = `${residentSeed.firstName} ${residentSeed.lastName} - ועד בית ${residentSeed.address}`;

    const currentInvoice = await prisma.invoice.create({
      data: {
        residentId: residentProfile.id,
        items: [{ description: monthlyDescription, quantity: 1, unitPrice: residentSeed.monthlyFee }],
        amount: residentSeed.monthlyFee,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
        createdAt: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    });

    await prisma.invoice.create({
      data: {
        residentId: residentProfile.id,
        items: [{ description: `${monthlyDescription} - חודש קודם`, quantity: 1, unitPrice: residentSeed.monthlyFee }],
        amount: residentSeed.monthlyFee,
        dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
        createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        status: index % 3 === 0 ? 'PAID' : 'UNPAID',
      },
    });

    await prisma.recurringInvoice.create({
      data: {
        residentId: residentProfile.id,
        title: 'ועד בית חודשי',
        items: [{ description: 'תשלום חודשי ועד בית', quantity: 1, unitPrice: residentSeed.monthlyFee }],
        amount: residentSeed.monthlyFee,
        recurrence: 'monthly',
        autopayEnabled: index % 2 === 0,
        dueDaysAfterIssue: 10,
        nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        lastRunAt: new Date(now.getFullYear(), now.getMonth(), 1),
        active: true,
      },
    });

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        residentId: residentProfile.id,
        provider: 'tranzila',
        token: `rubina42_pm_${residentProfile.id}`,
        brand: index % 2 === 0 ? 'Visa' : 'Mastercard',
        last4: `${4242 + index}`.slice(-4),
        expMonth: 12,
        expYear: now.getFullYear() + 3,
        isDefault: true,
      },
    });

    if (index % 3 === 0) {
      await prisma.paymentIntent.create({
        data: {
          invoiceId: currentInvoice.id,
          amount: currentInvoice.amount,
          currency: 'NIS',
          provider: 'tranzila',
          status: 'SUCCEEDED',
          providerIntentId: `rubina42_pi_${currentInvoice.id}`,
          paymentMethodId: paymentMethod.id,
          createdAt: new Date(now.getFullYear(), now.getMonth(), 3),
        },
      });

      await prisma.invoice.update({
        where: { id: currentInvoice.id },
        data: { status: 'PAID' },
      });
    }

    await prisma.notification.createMany({
      data: [
        {
          tenantId: 1,
          buildingId: rubina42Building.id,
          userId: user.id,
          title: 'עדכון ועד בית רובינא 42',
          message: `חשבון ועד הבית ליחידה ${residentSeed.unitNumber} זמין באזור האישי.`,
          type: 'FINANCE',
        },
        {
          tenantId: 1,
          buildingId: rubina42Building.id,
          userId: user.id,
          title: 'בדיקת מעלית מתוכננת',
          message: 'תתקיים בדיקת מעלית ביום ראשון הקרוב בין 09:00 ל-11:00.',
          type: 'MAINTENANCE',
        },
      ],
    });

    await prisma.communication.create({
      data: {
        buildingId: rubina42Building.id,
        unitId: unit.id,
        senderId: createdUsers['maya@demo.com'].id,
        recipientId: user.id,
        maintenanceScheduleId: rubinaSchedule.id,
        subject: `ברוכים הבאים לנתוני הבדיקה של יחידה ${residentSeed.unitNumber}`,
        message: `נוצרו עבורך נתוני בדיקה מלאים עבור ${residentSeed.firstName} ${residentSeed.lastName}, כולל חיובים, מסמכים והתראות.`,
        channel: 'PORTAL',
      },
    });
  }

  console.log('Seed complete. Demo credentials:');
  console.table(
    credentials.map((c) => ({ email: c.email, password: c.password, role: c.role }))
  );
}

main().finally(async () => {
  await prisma.$disconnect();
});
