import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      passwordHash,
      role: 'ADMIN',
      tenantId: 1,
    },
    create: {
      email: 'admin@demo.com',
      passwordHash,
      role: 'ADMIN',
      tenantId: 1,
    },
  });

  await prisma.resident.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.building.deleteMany();
  await prisma.user.deleteMany({ where: { role: 'RESIDENT' } });

  const residentPassword = await bcrypt.hash('resident123', 10);

  await prisma.building.createMany({
    data: [
      { name: 'אפרים קישון 5', address: 'אפרים קישון 5, הרצליה', tenantId: 1 },
      { name: 'אמה טאובר 9', address: 'אמה טאובר 9, הרצליה', tenantId: 1 },
      { name: 'אפריים קישון 24', address: 'אפריים קישון 24, הרצליה', tenantId: 1 },
      { name: 'אריאל 5', address: 'אריאל 5, הרצליה', tenantId: 1 },
    ],
    skipDuplicates: true,
  });

  await prisma.building.create({
    data: {
      name: 'Demo Building',
      address: '123 Main St',
      tenantId: 1,
      units: {
        create: [
          {
            number: '1A',
            residents: {
              create: [
                {
                  user: {
                    create: {
                      email: 'resident1@demo.com',
                      passwordHash: residentPassword,
                      role: 'RESIDENT',
                      tenantId: 1,
                    },
                  },
                },
              ],
            },
          },
          {
            number: '1B',
            residents: {
              create: [
                {
                  user: {
                    create: {
                      email: 'resident2@demo.com',
                      passwordHash: residentPassword,
                      role: 'RESIDENT',
                      tenantId: 1,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
