import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating special users: maya@demo.com and user@demo.com');

  const passwordHash = await bcrypt.hash('demo123', 10);

  // Create Maya (PM role)
  const maya = await prisma.user.upsert({
    where: { email: 'maya@demo.com' },
    update: {
      passwordHash,
      role: Role.PM,
      tenantId: 1,
    },
    create: {
      email: 'maya@demo.com',
      passwordHash,
      role: Role.PM,
      tenantId: 1,
    },
  });

  // Create User (RESIDENT role)
  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {
      passwordHash,
      role: Role.RESIDENT,
      tenantId: 1,
    },
    create: {
      email: 'user@demo.com',
      passwordHash,
      role: Role.RESIDENT,
      tenantId: 1,
    },
  });

  // Get the first building for assignment
  const firstBuilding = await prisma.building.findFirst({
    where: { tenantId: 1 },
    orderBy: { id: 'asc' }
  });

  if (!firstBuilding) {
    throw new Error('No buildings found. Please run the seed script first.');
  }

  // Create a unit for the user if it doesn't exist
  let userUnit = await prisma.unit.findFirst({
    where: { 
      buildingId: firstBuilding.id,
      number: '100' // Special unit for our demo user
    }
  });

  if (!userUnit) {
    userUnit = await prisma.unit.create({
      data: {
        number: '100',
        buildingId: firstBuilding.id,
        area: 120,
        bedrooms: 4,
        bathrooms: 2,
        parkingSpaces: 1,
        floor: 10,
      },
    });
  }

  // Create resident profile for user
  const resident = await prisma.resident.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  // Connect resident to unit
  await prisma.unit.update({
    where: { id: userUnit.id },
    data: {
      residents: {
        connect: { id: resident.id }
      }
    }
  });

  console.log('✅ Special users created successfully:');
  console.log(`📧 maya@demo.com (PM) - Password: demo123`);
  console.log(`📧 user@demo.com (RESIDENT) - Password: demo123`);
  console.log(`🏢 User assigned to building: ${firstBuilding.name} (Unit ${userUnit.number})`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating special users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
