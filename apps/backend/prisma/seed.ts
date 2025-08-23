import {
  PrismaClient,
  Role,
  TicketSeverity,
  TicketStatus,
  InvoiceStatus,
} from '.prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Scale configuration for different dataset sizes
const SCALE_CONFIG = {
  small: { buildings: 3, units: 20 },
  medium: { buildings: 4, units: 35 },
  large: { buildings: 5, units: 50 },
} as const;

const scale = (process.env.SEED_SCALE || 'small') as keyof typeof SCALE_CONFIG;
const config = SCALE_CONFIG[scale] ?? SCALE_CONFIG.small;

// deterministic data
faker.seed(123);

async function createUser(
  email: string,
  role: Prisma.Role,
  tenantId: number,
  passwordHash: string,
) {
  return prisma.user.create({
    data: { email, passwordHash, role, tenantId },
  });
}

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
    prisma.user.deleteMany({ where: { role: { not: Prisma.Role.MASTER } } }),
  ]);

  const credentials: { email: string; password: string; role: Prisma.Role }[] = [];

  const defaultPassword = 'password123';
  const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);

  // master user for DEV
  const masterPassword = 'master123';
  const masterHash = await bcrypt.hash(masterPassword, 10);
  const master = await prisma.user.upsert({
    where: { email: 'master@demo.com' },
    update: { passwordHash: masterHash, role: Prisma.Role.MASTER, tenantId: 1 },
    create: {
      email: 'master@demo.com',
      passwordHash: masterHash,
      role: Prisma.Role.MASTER,
      tenantId: 1,
    },
  });
  credentials.push({ email: master.email, password: masterPassword, role: Prisma.Role.MASTER });

  for (let tenantId = 1; tenantId <= 2; tenantId++) {
    const admin = await createUser(
      `admin${tenantId}@demo.com`,
      Prisma.Role.ADMIN,
      tenantId,
      defaultPasswordHash,
    );
    const pm = await createUser(
      `pm${tenantId}@demo.com`,
      Prisma.Role.PM,
      tenantId,
      defaultPasswordHash,
    );
    const tech = await createUser(
      `tech${tenantId}@demo.com`,
      Prisma.Role.TECH,
      tenantId,
      defaultPasswordHash,
    );
    const accountant = await createUser(
      `accountant${tenantId}@demo.com`,
      Prisma.Role.ACCOUNTANT,
      tenantId,
      defaultPasswordHash,
    );
    credentials.push(
      { email: admin.email, password: defaultPassword, role: admin.role },
      { email: pm.email, password: defaultPassword, role: pm.role },
      { email: tech.email, password: defaultPassword, role: tech.role },
      {
        email: accountant.email,
        password: defaultPassword,
        role: accountant.role,
      },
    );

    // suppliers for tenant
    const suppliers = [] as { id: number }[];
    for (let s = 1; s <= 2; s++) {
      const supplierUser = await createUser(
        `supplier${s}t${tenantId}@demo.com`,
        Prisma.Role.TECH,
        tenantId,
        defaultPasswordHash,
      );
      credentials.push({
        email: supplierUser.email,
        password: defaultPassword,
        role: supplierUser.role,
      });
      const supplier = await prisma.supplier.create({
        data: {
          name: faker.company.name(),
          skills: [faker.helpers.arrayElement(['electric', 'plumbing', 'general'])],
          rating: faker.number.float({ min: 3, max: 5, precision: 0.1 }),
          documents: [],
          userId: supplierUser.id,
        },
      });
      suppliers.push({ id: supplier.id });
    }

    for (let b = 0; b < config.buildings; b++) {
      const building = await prisma.building.create({
        data: {
          name: `Building ${b + 1} T${tenantId}`,
          address: faker.location.streetAddress(),
          tenantId,
        },
      });

      const ticketStatuses = [
        Prisma.TicketStatus.OPEN,
        Prisma.TicketStatus.ASSIGNED,
        Prisma.TicketStatus.IN_PROGRESS,
        Prisma.TicketStatus.RESOLVED,
      ];

      for (let u = 1; u <= config.units; u++) {
        const residentEmail = `resident${tenantId}_${b + 1}_${u}@demo.com`;
        const residentUser = await createUser(
          residentEmail,
          Prisma.Role.RESIDENT,
          tenantId,
          defaultPasswordHash,
        );
        credentials.push({
          email: residentUser.email,
          password: defaultPassword,
          role: residentUser.role,
        });

        const resident = await prisma.resident.create({
          data: { userId: residentUser.id },
        });

        const unit = await prisma.unit.create({
          data: {
            number: String(u),
            buildingId: building.id,
            residents: { connect: { id: resident.id } },
          },
        });

        await prisma.invoice.create({
          data: {
            residentId: resident.id,
            items: { description: 'Monthly fee' },
            amount: faker.number.int({ min: 100, max: 400 }),
            status: u % 2 === 0 ? Prisma.InvoiceStatus.PAID : Prisma.InvoiceStatus.UNPAID,
          },
        });

        if (u <= ticketStatuses.length) {
          const ticket = await prisma.ticket.create({
            data: {
              unitId: unit.id,
              severity: faker.helpers.arrayElement([
                Prisma.TicketSeverity.LOW,
                Prisma.TicketSeverity.MEDIUM,
                Prisma.TicketSeverity.HIGH,
              ]),
              status: ticketStatuses[u - 1],
              slaDue: faker.date.soon({ days: 7 }),
              photos: ['https://placehold.co/600x400'],
              assignedToId: tech.id,
            },
          });

          await prisma.workOrder.create({
            data: {
              ticketId: ticket.id,
              supplierId: suppliers[0].id,
              costEstimate: faker.number.int({ min: 50, max: 500 }),
              createdAt: u === 1 ? new Date() : faker.date.recent({ days: 5 }),
            },
          });
        }
      }
    }
  }

  console.log('Seed complete. Demo credentials:');
  console.table(
    credentials.map((c) => ({ email: c.email, password: c.password, role: c.role })),
  );
}

main().finally(async () => {
  await prisma.$disconnect();
});

