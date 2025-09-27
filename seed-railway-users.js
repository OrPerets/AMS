// Script to seed Railway PostgreSQL database with demo users
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.RAILWAY_DATABASE_URL || 'postgresql://postgres:drmEkGEHiPgxbdUwAWpkHgOvqiKCvhhk@yamanote.proxy.rlwy.net:51560/railway';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function seedRailwayUsers() {
  try {
    console.log('🌱 Seeding Railway database with demo users...');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to Railway database');
    
    // Check if users already exist
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log(`⚠️  Database already has ${existingUsers} users. Skipping seed.`);
      return;
    }
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('master123', 12);
    
    // Create demo users
    const demoUsers = [
      {
        email: 'master@demo.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        tenantId: 1, // Default tenant ID
        phone: '+1234567890',
        notificationPreferences: {
          email: true,
          sms: true,
          push: true
        }
      },
      {
        email: 'manager@demo.com',
        passwordHash: hashedPassword,
        role: 'PM',
        tenantId: 1, // Default tenant ID
        phone: '+1234567891',
        notificationPreferences: {
          email: true,
          sms: false,
          push: true
        }
      },
      {
        email: 'tenant@demo.com',
        passwordHash: hashedPassword,
        role: 'RESIDENT',
        tenantId: 1, // Default tenant ID
        phone: '+1234567892',
        notificationPreferences: {
          email: true,
          sms: true,
          push: false
        }
      }
    ];
    
    console.log('👥 Creating demo users...');
    
    for (const userData of demoUsers) {
      const user = await prisma.user.create({
        data: userData
      });
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }
    
    console.log('\n🎉 Successfully seeded Railway database!');
    console.log('📋 Demo users created:');
    console.log('   - master@demo.com (ADMIN) - password: master123');
    console.log('   - manager@demo.com (MANAGER) - password: master123');
    console.log('   - tenant@demo.com (TENANT) - password: master123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedRailwayUsers();
