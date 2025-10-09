import { PrismaClient, Role } from '.prisma/client';
import * as bcrypt from 'bcryptjs';

// Remote database connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:drmEkGEHiPgxbdUwAWpkHgOvqiKCvhhk@yamanote.proxy.rlwy.net:51560/railway'
    }
  }
});

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeding to remote database...');

    const credentials: { email: string; password: string; role: Role }[] = [];
    const defaultPassword = 'password123';
    const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);

    // Master user
    const masterPassword = 'master123';
    const masterHash = await bcrypt.hash(masterPassword, 10);
    
    console.log('👑 Creating master user...');
    const master = await prisma.user.upsert({
      where: { email: 'master@demo.com' },
      update: { 
        passwordHash: masterHash, 
        role: Role.MASTER, 
        tenantId: 1 
      },
      create: {
        email: 'master@demo.com',
        passwordHash: masterHash,
        role: Role.MASTER,
        tenantId: 1,
      },
    });
    credentials.push({ email: master.email, password: masterPassword, role: Role.MASTER });
    console.log(`✅ Master user created: ${master.email}`);

    // Demo users
    const users = [
      { email: 'amit.magen@demo.com', role: Role.ADMIN },
      { email: 'or.peretz@demo.com', role: Role.ADMIN },
      { email: 'maya@demo.com', role: Role.PM },
      { email: 'client@demo.com', role: Role.RESIDENT },
      { email: 'tech1@demo.com', role: Role.TECH },
      { email: 'tech2@demo.com', role: Role.TECH },
      { email: 'tech3@demo.com', role: Role.TECH },
    ];

    console.log('👥 Creating demo users...');
    for (const u of users) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { 
          passwordHash: defaultPasswordHash, 
          role: u.role, 
          tenantId: 1 
        },
        create: {
          email: u.email,
          passwordHash: defaultPasswordHash,
          role: u.role,
          tenantId: 1,
        },
      });
      credentials.push({ email: u.email, password: defaultPassword, role: u.role });
      console.log(`✅ User created: ${user.email} (${user.role})`);
    }

    console.log('\n🎉 User seeding completed successfully!');
    console.log('\n📋 Demo credentials:');
    console.table(
      credentials.map((c) => ({ 
        email: c.email, 
        password: c.password, 
        role: c.role 
      }))
    );

    console.log('\n🔗 Database URL: postgresql://postgres:***@yamanote.proxy.rlwy.net:51560/railway');
    console.log('💡 You can now use these credentials to log into your application!');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedUsers().catch((error) => {
  console.error('💥 Seeding failed:', error);
  process.exit(1);
});
