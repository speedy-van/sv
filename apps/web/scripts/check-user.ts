import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const email = 'ahmadalwakai76@gmail.com';
    const password = 'Aa234311Aa@@@';

    console.log('🔍 Checking user in database...\n');

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        adminRole: true,
        isActive: true,
        emailVerified: true,
        password: true,
      },
    });

    if (!user) {
      console.log('❌ User not found in database!');
      return;
    }

    console.log('✅ User found in database:');
    console.log('═════════════════════════════════════════');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Admin Role:', user.adminRole);
    console.log('Is Active:', user.isActive);
    console.log('Email Verified:', user.emailVerified);
    console.log('Has Password:', !!user.password);
    console.log('═════════════════════════════════════════\n');

    // Test password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔑 Password verification:', passwordMatch ? '✅ VALID' : '❌ INVALID');

    if (passwordMatch) {
      console.log('\n✅ User credentials are correct!');
      console.log('📝 Login details:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('   Role:', user.role);
      console.log('   Admin Role:', user.adminRole);
      console.log('\n💡 Try logging in at: /auth/login');
      console.log('   Or directly at: /admin (will redirect to login if needed)');
    }
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();








