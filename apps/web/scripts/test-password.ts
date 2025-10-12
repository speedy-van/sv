import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'ahmadalwakai76@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('🔍 Testing password for:', user.email);
    console.log('📋 Stored hash:', user.password);
    
    // Test the password from check-user.ts
    const passwords = [
      'Aa234311Aa@@@',
      'Aa12341234',
      'admin123',
    ];

    for (const pw of passwords) {
      const matches = await bcrypt.compare(pw, user.password);
      console.log(`\n🔐 Testing "${pw}": ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
