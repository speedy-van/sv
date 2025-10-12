import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('🔍 Checking admin user...');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'ahmadalwakai76+admin@gmail.com' },
    });

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      adminRole: user.adminRole,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    });

    // Test password
    const passwordMatch = await bcrypt.compare('Aa234311Aa@@@', user.password);
    console.log(
      '🔑 Password test result:',
      passwordMatch ? '✅ MATCH' : '❌ NO MATCH'
    );

    // Check if user can login
    if (user.role === 'admin' && user.isActive && passwordMatch) {
      console.log('✅ User can login as admin');
    } else {
      console.log('❌ User cannot login as admin. Issues:');
      if (user.role !== 'admin') console.log('  - Role is not admin');
      if (!user.isActive) console.log('  - User is not active');
      if (!passwordMatch) console.log('  - Password does not match');
    }

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection is working');
    } catch (error) {
      console.log('❌ Database connection failed:', error);
    }
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
