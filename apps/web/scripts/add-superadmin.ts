import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const email = 'deloalo99@gmail.com';
    const password = 'Aa234311Aa@@@';
    const name = 'deloalo99';

    console.log('🔐 Creating new superadmin user...\n');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️ User already exists! Updating...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'admin',
          adminRole: 'superadmin',
          isActive: true,
          emailVerified: true,
        },
      });

      console.log('✅ User updated successfully!');
      console.log('═════════════════════════════════════════');
      console.log('ID:', updatedUser.id);
      console.log('Email:', updatedUser.email);
      console.log('Name:', updatedUser.name);
      console.log('Role:', updatedUser.role);
      console.log('Admin Role:', updatedUser.adminRole);
      console.log('Is Active:', updatedUser.isActive);
      console.log('Email Verified:', updatedUser.emailVerified);
      console.log('═════════════════════════════════════════\n');
    } else {
      console.log('📝 Creating new user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'admin',
          adminRole: 'superadmin',
          isActive: true,
          emailVerified: true,
        },
      });

      console.log('✅ User created successfully!');
      console.log('═════════════════════════════════════════');
      console.log('ID:', newUser.id);
      console.log('Email:', newUser.email);
      console.log('Name:', newUser.name);
      console.log('Role:', newUser.role);
      console.log('Admin Role:', newUser.adminRole);
      console.log('Is Active:', newUser.isActive);
      console.log('Email Verified:', newUser.emailVerified);
      console.log('═════════════════════════════════════════\n');
    }

    // Verify the password works
    console.log('🔐 Verifying password...');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log('Password verification:', isValid ? '✅ VALID' : '❌ INVALID');
    }

    console.log('\n💡 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role: admin (superadmin)');
    console.log('\n🌐 Login at: http://localhost:3000/auth/login');

    // List all admin users
    console.log('\n📋 All admin users:');
    console.log('═════════════════════════════════════════');
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        email: true,
        name: true,
        role: true,
        adminRole: true,
        isActive: true,
      },
    });

    admins.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Admin Role: ${admin.adminRole}`);
      console.log(`   Active: ${admin.isActive}`);
    });
    console.log('═════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
