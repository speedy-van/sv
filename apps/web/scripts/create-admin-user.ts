import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'ahmad22wakaa@gmail.com' },
    });

    if (existingUser) {
      console.log('⚠️ User already exists, updating password...');

      // Hash the new password
      const hashedPassword = await bcrypt.hash('admin123', 12);

      // Update the existing user
      const updatedUser = await prisma.user.update({
        where: { email: 'ahmad22wakaa@gmail.com' },
        data: {
          password: hashedPassword,
          role: 'admin',
          adminRole: 'superadmin',
          isActive: true,
          emailVerified: true,
        },
      });

      console.log('✅ User updated successfully:', {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        adminRole: updatedUser.adminRole,
      });
    } else {
      console.log('🆕 Creating new admin user...');

      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 12);

      // Create new admin user
      const newUser = await prisma.user.create({
        data: {
          email: 'ahmad22wakaa@gmail.com',
          name: 'Ahmad Alwakai - Super Admin',
          password: hashedPassword,
          role: 'admin',
          adminRole: 'superadmin',
          isActive: true,
          emailVerified: true,
        },
      });

      console.log('✅ Admin user created successfully:', {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        adminRole: newUser.adminRole,
      });
    }

    // Test the password
    const testUser = await prisma.user.findUnique({
      where: { email: 'ahmad22wakaa@gmail.com' },
    });

    if (testUser) {
      const passwordMatch = await bcrypt.compare(
        'admin123',
        testUser.password
      );
      console.log(
        '🔑 Password test result:',
        passwordMatch ? '✅ MATCH' : '❌ NO MATCH'
      );

      if (passwordMatch) {
        console.log('🎉 Admin user is ready for login!');
        console.log('📧 Email: ahmad22wakaa@gmail.com');
        console.log('🔑 Password: admin123');
        console.log('🔗 Login URL: /admin/login');
      }
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
