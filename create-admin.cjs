const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'ahmadalwakai76@gmail.com',
        name: 'Ahmad Alwakai',
        password: hashedPassword,
        role: 'admin',
        adminRole: 'superadmin',
        emailVerified: true
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password: password123');
    console.log('👤 Role:', user.role);
    console.log('⭐ Admin Role:', user.adminRole);
    console.log('🆔 User ID:', user.id);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️ User already exists, updating password...');
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.update({
        where: { email: 'ahmadalwakai76@gmail.com' },
        data: { 
          password: hashedPassword,
          role: 'admin',
          adminRole: 'superadmin',
          emailVerified: true
        }
      });
      
      console.log('✅ Admin user updated successfully!');
      console.log('📧 Email:', user.email);
      console.log('🔑 Password: password123');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
