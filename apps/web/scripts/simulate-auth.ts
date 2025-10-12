import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const prisma = new PrismaClient();

async function simulateAuth() {
  try {
    const email = 'ahmadalwakai76@gmail.com';
    const password = 'Aa234311Aa@@@';

    console.log('🔐 Simulating NextAuth authorize flow...\n');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('');

    // Step 1: Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log('✅ Step 1: Normalized email:', normalizedEmail);

    // Step 2: Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !user.password) {
      console.log('❌ Step 2: User not found or no password');
      return;
    }

    console.log('✅ Step 2: User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      adminRole: user.adminRole,
      isActive: user.isActive,
      hasPassword: !!user.password,
    });

    // Step 3: Verify password
    console.log('\n🔐 Step 3: Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Password is INVALID');
      return;
    }

    console.log('✅ Password is VALID');

    // Step 4: Check if user is active
    console.log('\n🔐 Step 4: Checking user status...');
    if (!user.isActive) {
      console.log('❌ User is NOT ACTIVE');
      return;
    }

    console.log('✅ User is ACTIVE');

    // Step 5: Return user object
    console.log('\n✅ Step 5: Authorization SUCCESSFUL');
    console.log('📦 Returned user object:', {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
      adminRole: user.adminRole,
    });

    console.log('\n🎉 All checks passed! User should be authenticated.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateAuth();
