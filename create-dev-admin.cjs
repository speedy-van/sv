/**
 * Create admin user in Development database
 * Run: node create-dev-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'ahmadalwakai76@gmail.com';
    // إذا كنت تعرف الباسورد الحقيقي، ضعه هنا
    // أو استخدم باسورد بسيط للتطوير
    const password = process.argv[2] || 'admin123'; // يمكنك تمرير الباسورد كـ argument
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('🔍 Checking if user exists...');
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('✅ User already exists, updating password...');
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          isActive: true,
          role: 'admin',
          adminRole: 'superadmin'
        }
      });
      console.log(`✅ User updated: ${email}`);
      console.log(`🔑 Password: ${password}`);
    } else {
      console.log('📝 Creating new user...');
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Ahmad Alwakai',
          phone: '+966500000000',
          role: 'admin',
          adminRole: 'superadmin',
          isActive: true
        }
      });
      console.log(`✅ User created: ${email}`);
      console.log(`🔑 Password: ${password}`);
    }

    console.log('\n🎉 Success! You can now login at http://localhost:3000/auth/login');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
