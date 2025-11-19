import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔐 Creating super admin user...');

    const email = 'ahmadalwakai76@gmail.com';
    const password = 'Aa234311Aa@@@';
    const name = 'Ahmad Alwakai - Super Admin';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️ User already exists, updating to super admin...');

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update the existing user
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'admin',
          adminRole: 'superadmin',
          isActive: true,
          emailVerified: true,
        } as any,
      });

      console.log('✅ User updated successfully:', {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        adminRole: updatedUser.adminRole,
        isActive: updatedUser.isActive,
        emailVerified: updatedUser.emailVerified,
      });
    } else {
      console.log('🆕 Creating new super admin user...');

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new super admin user
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'admin',
          adminRole: 'superadmin',
          isActive: true,
          emailVerified: true,
        } as any,
      });

      console.log('✅ Super admin user created successfully:', {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        adminRole: newUser.adminRole,
        isActive: newUser.isActive,
        emailVerified: newUser.emailVerified,
      });
    }

    // Test the password
    const testUser = await prisma.user.findUnique({
      where: { email },
    });

    if (testUser) {
      const passwordMatch = await bcrypt.compare(password, testUser.password);
      console.log(
        '🔑 Password test result:',
        passwordMatch ? '✅ MATCH' : '❌ NO MATCH'
      );

      if (passwordMatch) {
        console.log('\n🎉 Super admin user is ready for login!');
        console.log('═════════════════════════════════════════');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`👤 Name: ${name}`);
        console.log(`🛡️  Role: admin (superadmin)`);
        console.log(`🔗 Login URL: /admin/login`);
        console.log('═════════════════════════════════════════\n');
      }
    }
  } catch (error) {
    console.error('❌ Error creating super admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();

