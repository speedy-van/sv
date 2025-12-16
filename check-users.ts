import { prisma } from './apps/web/src/lib/prisma';
import bcrypt from 'bcryptjs';

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        adminRole: true,
        isActive: true,
        password: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('👥 Users in database:', users.length);
    console.log('\n');

    for (const user of users) {
      console.log('📧 Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   Role:', user.role);
      console.log('   Admin Role:', user.adminRole || 'N/A');
      console.log('   Active:', user.isActive);
      console.log('   Has Password:', !!user.password);
      
      // Try to verify common test passwords
      if (user.password) {
        const testPasswords = ['admin123', 'password', '123456', 'admin'];
        for (const testPwd of testPasswords) {
          const matches = await bcrypt.compare(testPwd, user.password);
          if (matches) {
            console.log('   ✅ Password matches:', testPwd);
            break;
          }
        }
      }
      console.log('');
    }
    
    // Create admin user if none exists
    if (users.length === 0) {
      console.log('⚠️ No users found. Creating default admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = await prisma.user.create({
        data: {
          email: 'admin@speedy-van.co.uk',
          name: 'Admin',
          password: hashedPassword,
          role: 'admin',
          adminRole: 'super_admin',
          isActive: true,
        },
      });
      
      console.log('✅ Created admin user:');
      console.log('   Email: admin@speedy-van.co.uk');
      console.log('   Password: admin123');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
