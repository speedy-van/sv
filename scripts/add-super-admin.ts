/**
 * Add Super Admin User to Database
 * Usage: npx tsx scripts/add-super-admin.ts
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from apps/web/.env.local
config({ path: resolve(__dirname, '../apps/web/.env.local') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addSuperAdmin() {
  try {
    console.log('🔧 Adding Super Admin user...\n');

    const email = 'bdeloalo99@gmail.com';
    const password = 'Aa234311Aa@@@';
    const name = 'Super Admin';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log(`📧 Email: ${existingUser.email}`);
      console.log(`👤 Name: ${existingUser.name}`);
      console.log(`🔐 Role: ${existingUser.role}`);
      console.log(`✅ Active: ${existingUser.isActive}`);
      
      // Update existing user to admin if needed
      if (existingUser.role !== 'admin') {
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'admin',
            isActive: true,
          },
        });
        console.log('\n✅ Updated user role to ADMIN');
      } else {
        console.log('\n✅ User is already an ADMIN');
      }
      
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create super admin user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'admin',
        isActive: true,
        emailVerified: true,
      },
    });

    console.log('\n✅ Super Admin created successfully!\n');
    console.log('📋 User Details:');
    console.log('─────────────────────────────────');
    console.log(`📧 Email:    ${user.email}`);
    console.log(`👤 Name:     ${user.name}`);
    console.log(`🔐 Role:     ${user.role}`);
    console.log(`🆔 ID:       ${user.id}`);
    console.log(`✅ Active:   ${user.isActive}`);
    console.log(`📅 Created:  ${user.createdAt.toLocaleString()}`);
    console.log('─────────────────────────────────\n');
    
    console.log('🎉 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Login URL: http://localhost:3000/admin/login\n');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSuperAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

