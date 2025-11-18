/**
 * Copy user from Production to Development database
 * Run: node copy-user-to-dev.js ahmadalwakai76@gmail.com
 */

const { PrismaClient } = require('@prisma/client');

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide email as argument');
  console.log('Usage: node copy-user-to-dev.js <email>');
  process.exit(1);
}

async function copyUser() {
  // Production database
  const prodPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
      }
    }
  });

  // Development database - you need to temporarily set DEV_DATABASE_URL
  const devPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DEV_DATABASE_URL
      }
    }
  });

  try {
    console.log(`🔍 Looking for user: ${email} in Production...`);
    
    const prodUser = await prodPrisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!prodUser) {
      console.error(`❌ User not found in Production: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user in Production:`, {
      id: prodUser.id,
      name: prodUser.name,
      email: prodUser.email,
      role: prodUser.role
    });

    console.log(`\n📝 Creating user in Development...`);

    const devUser = await devPrisma.user.upsert({
      where: { email: prodUser.email },
      create: {
        id: prodUser.id,
        email: prodUser.email,
        password: prodUser.password, // نسخ الباسورد المشفر
        name: prodUser.name,
        phone: prodUser.phone,
        role: prodUser.role,
        adminRole: prodUser.adminRole,
        isActive: prodUser.isActive,
        createdAt: prodUser.createdAt,
        updatedAt: prodUser.updatedAt,
      },
      update: {
        password: prodUser.password,
        name: prodUser.name,
        phone: prodUser.phone,
        role: prodUser.role,
        adminRole: prodUser.adminRole,
        isActive: prodUser.isActive,
      }
    });

    console.log(`✅ User created/updated in Development:`, {
      id: devUser.id,
      name: devUser.name,
      email: devUser.email,
      role: devUser.role
    });

    console.log(`\n🎉 Success! You can now login with ${email} in Development`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prodPrisma.$disconnect();
    await devPrisma.$disconnect();
  }
}

copyUser();
