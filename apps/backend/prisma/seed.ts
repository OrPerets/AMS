import { PrismaClient, Role, TicketSeverity, TicketStatus } from '.prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding should not run in production');
  }

  // wipe existing data for idempotency
  await prisma.$transaction([
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
  for (const label of buildingLabels) {
    const building = await prisma.building.create({
      data: { name: label, address: label, tenantId: 1 },
    });
    buildings.push({ id: building.id });
  }

  // unit and tickets for demonstration
  const unit = await prisma.unit.create({
    data: {
      number: '1',
      buildingId: buildings[0].id,
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

  console.log('Seed complete. Demo credentials:');
  console.table(
    credentials.map((c) => ({ email: c.email, password: c.password, role: c.role }))
  );
}

main().finally(async () => {
  await prisma.$disconnect();
});

