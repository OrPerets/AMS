import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUser(email: string, password: string, role: Role, tenantId = 1) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, role, tenantId },
    create: { email, passwordHash, role, tenantId },
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Point it to your production database to proceed.');
  }

  // Ensure enum has MASTER value in production
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'Role' AND e.enumlabel = 'MASTER'
      ) THEN
        ALTER TYPE "Role" ADD VALUE 'MASTER';
      END IF;
    END
    $$;
  `);

  const master = { email: 'master@demo.com', password: 'master123', role: Role.MASTER };

  const users: { email: string; role: Role }[] = [
    { email: 'amit.magen@demo.com', role: Role.ADMIN },
    { email: 'or.peretz@demo.com', role: Role.ADMIN },
    { email: 'maya@demo.com', role: Role.PM },
    { email: 'client@demo.com', role: Role.RESIDENT },
    { email: 'tech1@demo.com', role: Role.TECH },
    { email: 'tech2@demo.com', role: Role.TECH },
    { email: 'tech3@demo.com', role: Role.TECH },
  ];

  console.log('Upserting users into database...');
  const created: { email: string; role: Role; password: string }[] = [];

  const m = await upsertUser(master.email, master.password, master.role);
  created.push({ email: m.email, role: m.role, password: master.password });

  for (const u of users) {
    const user = await upsertUser(u.email, 'password123', u.role);
    created.push({ email: user.email, role: user.role, password: 'password123' });
  }

  // Ensure Resident profile for the demo client exists
  const client = await prisma.user.findUnique({ where: { email: 'client@demo.com' } });
  if (client) {
    await prisma.resident.upsert({
      where: { userId: client.id },
      update: {},
      create: { userId: client.id },
    });
  }

  console.table(created);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


