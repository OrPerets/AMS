// Script to check users in Railway PostgreSQL database
const { PrismaClient } = require('@prisma/client');

// You need to replace this with your actual Railway DATABASE_URL
const DATABASE_URL = process.env.RAILWAY_DATABASE_URL || 'your-railway-database-url-here';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function checkRailwayUsers() {
  try {
    console.log('🔍 Checking Railway PostgreSQL users...');
    
    // Check connection
    await prisma.$connect();
    console.log('✅ Connected to Railway database');
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in Railway database: ${userCount}`);
    
    // Get all users
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        role: true,
        createdAt: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n👥 Users in Railway database:');
    console.table(users);
    
    // Check for demo users specifically
    const demoUsers = users.filter(user => 
      user.email.includes('demo') || user.email.includes('master')
    );
    
    console.log(`\n🎯 Demo users found: ${demoUsers.length}`);
    if (demoUsers.length > 0) {
      console.table(demoUsers);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure to:');
    console.log('1. Set RAILWAY_DATABASE_URL environment variable');
    console.log('2. Or replace the DATABASE_URL in this script');
    console.log('3. Ensure Railway PostgreSQL is running');
  } finally {
    await prisma.$disconnect();
  }
}

checkRailwayUsers();
