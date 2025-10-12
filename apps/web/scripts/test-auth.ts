import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const prisma = new PrismaClient();

async function testAuth() {
  try {
    const email = 'ahmadalwakai76@gmail.com';
    const password = 'Aa234311Aa@@@';

    console.log('🧪 Testing authentication flow...\n');

    // Step 1: Find user
    console.log('Step 1: Finding user...');
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
    });

    // Step 2: Check password
    console.log('\nStep 2: Checking password...');
    if (!user.password) {
      console.log('❌ User has no password!');
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid ? '✅ YES' : '❌ NO');

    // Step 3: Check role
    console.log('\nStep 3: Checking role...');
    console.log('User role:', user.role);
    console.log('Admin role:', user.adminRole);

    // Step 4: Check active status
    console.log('\nStep 4: Checking active status...');
    console.log('Is active:', user.isActive);
    console.log('Email verified:', user.emailVerified);

    // Step 5: Test with different email cases
    console.log('\nStep 5: Testing email case sensitivity...');
    const userUpperCase = await prisma.user.findUnique({
      where: { email: email.toUpperCase() },
    });
    const userLowerCase = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    console.log('Found with UPPERCASE:', !!userUpperCase);
    console.log('Found with lowercase:', !!userLowerCase);

    // Final verdict
    console.log('\n═════════════════════════════════════════');
    if (isPasswordValid && user.isActive && user.role === 'admin') {
      console.log('✅ AUTH SHOULD WORK!');
      console.log('All conditions are satisfied.');
    } else {
      console.log('❌ AUTH WILL FAIL!');
      console.log('Reasons:');
      if (!isPasswordValid) console.log('  - Password invalid');
      if (!user.isActive) console.log('  - User not active');
      if (user.role !== 'admin') console.log('  - User is not admin');
    }
    console.log('═════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();








