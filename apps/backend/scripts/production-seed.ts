import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production database seeding...');

  // Create demo users for different roles
  const users = [
    {
      email: 'admin@demo.com',
      password: 'admin123',
      role: 'ADMIN' as const,
      tenantId: 1,
    },
    {
      email: 'pm@demo.com',
      password: 'pm123',
      role: 'PM' as const,
      tenantId: 1,
    },
    {
      email: 'tech@demo.com',
      password: 'tech123',
      role: 'TECH' as const,
      tenantId: 1,
    },
    {
      email: 'resident@demo.com',
      password: 'resident123',
      role: 'RESIDENT' as const,
      tenantId: 1,
    },
    {
      email: 'accountant@demo.com',
      password: 'accountant123',
      role: 'ACCOUNTANT' as const,
      tenantId: 1,
    },
    {
      email: 'master@demo.com',
      password: 'master123',
      role: 'MASTER' as const,
      tenantId: 1,
    },
  ];

  console.log('👥 Creating demo users...');
  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        passwordHash,
        role: userData.role,
        tenantId: userData.tenantId,
      },
      create: {
        email: userData.email,
        passwordHash,
        role: userData.role,
        tenantId: userData.tenantId,
      },
    });
    
    console.log(`✅ Created/updated user: ${userData.email} (${userData.role})`);
  }

  // Create demo buildings
  console.log('🏢 Creating demo buildings...');
  const buildings = [
    {
      name: 'Sunset Towers',
      address: '123 Sunset Boulevard, Tel Aviv',
      tenantId: 1,
      yearBuilt: 2020,
      floors: 15,
      totalUnits: 120,
      area: 15000.5,
      amenities: ['Gym', 'Pool', 'Parking', 'Security'],
      managerName: 'John Smith',
      contactEmail: 'manager@sunsettowers.com',
      contactPhone: '+972-50-123-4567',
      notes: 'Modern residential building with excellent amenities',
    },
    {
      name: 'Garden Plaza',
      address: '456 Garden Street, Haifa',
      tenantId: 1,
      yearBuilt: 2018,
      floors: 12,
      totalUnits: 96,
      area: 12000.0,
      amenities: ['Garden', 'Playground', 'Parking', 'Elevator'],
      managerName: 'Sarah Johnson',
      contactEmail: 'manager@gardenplaza.com',
      contactPhone: '+972-4-987-6543',
      notes: 'Family-friendly building with beautiful garden',
    },
  ];

  for (const buildingData of buildings) {
    await prisma.building.upsert({
      where: { 
        name_tenantId: {
          name: buildingData.name,
          tenantId: buildingData.tenantId,
        }
      },
      update: buildingData,
      create: buildingData,
    });
    
    console.log(`✅ Created/updated building: ${buildingData.name}`);
  }

  // Create demo units
  console.log('🏠 Creating demo units...');
  const buildings_db = await prisma.building.findMany();
  
  for (const building of buildings_db) {
    for (let floor = 1; floor <= Math.min(building.floors || 5, 5); floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const unitNumber = `${floor}${unit.toString().padStart(2, '0')}`;
        
        await prisma.unit.upsert({
          where: {
            number_buildingId: {
              number: unitNumber,
              buildingId: building.id,
            }
          },
          update: {
            area: 85.5 + Math.random() * 30,
            bedrooms: 2 + Math.floor(Math.random() * 2),
            bathrooms: 1 + Math.floor(Math.random() * 2),
            parkingSpaces: Math.floor(Math.random() * 2),
            floor: floor,
          },
          create: {
            number: unitNumber,
            buildingId: building.id,
            area: 85.5 + Math.random() * 30,
            bedrooms: 2 + Math.floor(Math.random() * 2),
            bathrooms: 1 + Math.floor(Math.random() * 2),
            parkingSpaces: Math.floor(Math.random() * 2),
            floor: floor,
          },
        });
      }
    }
    console.log(`✅ Created units for building: ${building.name}`);
  }

  // Create demo assets
  console.log('🔧 Creating demo assets...');
  for (const building of buildings_db) {
    const assets = [
      {
        name: 'HVAC System',
        category: 'HVAC' as const,
        description: 'Central air conditioning system',
        serialNumber: `HVAC-${building.id}-001`,
        location: 'Roof',
        purchaseDate: new Date('2020-01-15'),
        warrantyExpiry: new Date('2025-01-15'),
        value: 50000,
        salvageValue: 5000,
        quantity: 1,
        usefulLifeYears: 15,
        depreciationMethod: 'straight-line',
        status: 'ACTIVE',
      },
      {
        name: 'Elevator System',
        category: 'ELEVATORS' as const,
        description: 'Passenger elevator system',
        serialNumber: `ELEV-${building.id}-001`,
        location: 'Elevator Shaft',
        purchaseDate: new Date('2019-06-01'),
        warrantyExpiry: new Date('2024-06-01'),
        value: 75000,
        salvageValue: 7500,
        quantity: 1,
        usefulLifeYears: 20,
        depreciationMethod: 'straight-line',
        status: 'ACTIVE',
      },
      {
        name: 'Security System',
        category: 'SAFETY' as const,
        description: 'Building security and access control system',
        serialNumber: `SEC-${building.id}-001`,
        location: 'Lobby',
        purchaseDate: new Date('2020-03-10'),
        warrantyExpiry: new Date('2025-03-10'),
        value: 25000,
        salvageValue: 2500,
        quantity: 1,
        usefulLifeYears: 10,
        depreciationMethod: 'straight-line',
        status: 'ACTIVE',
      },
    ];

    for (const assetData of assets) {
      await prisma.asset.upsert({
        where: {
          serialNumber: assetData.serialNumber,
        },
        update: assetData,
        create: {
          ...assetData,
          buildingId: building.id,
        },
      });
    }
    
    console.log(`✅ Created assets for building: ${building.name}`);
  }

  // Create demo budgets
  console.log('💰 Creating demo budgets...');
  for (const building of buildings_db) {
    const currentYear = new Date().getFullYear();
    
    await prisma.budget.upsert({
      where: {
        buildingId_year: {
          buildingId: building.id,
          year: currentYear,
        }
      },
      update: {
        amount: 100000,
        actualSpent: 25000,
        status: 'ACTIVE',
        notes: `Annual maintenance budget for ${building.name}`,
      },
      create: {
        buildingId: building.id,
        name: `${currentYear} Annual Budget`,
        year: currentYear,
        amount: 100000,
        actualSpent: 25000,
        status: 'ACTIVE',
        notes: `Annual maintenance budget for ${building.name}`,
      },
    });
    
    console.log(`✅ Created budget for building: ${building.name}`);
  }

  console.log('🎉 Production database seeding completed successfully!');
  console.log('\n📋 Demo User Credentials:');
  console.log('Admin: admin@demo.com / admin123');
  console.log('PM: pm@demo.com / pm123');
  console.log('Tech: tech@demo.com / tech123');
  console.log('Resident: resident@demo.com / resident123');
  console.log('Accountant: accountant@demo.com / accountant123');
  console.log('Master: master@demo.com / master123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
