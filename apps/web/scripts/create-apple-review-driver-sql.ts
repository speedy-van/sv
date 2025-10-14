// Create Apple Review Test Driver Account using raw SQL
// Email: zadfad41@gmail.com
// Password: 112233

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAppleReviewDriver() {
  console.log('🍎 Creating Apple Review Test Driver Account...\n');

  const testEmail = 'zadfad41@gmail.com';
  const testPassword = '112233';
  const testName = 'Apple Test Driver';

  try {
    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    console.log('✅ Password hashed\n');

    // Check if user exists using raw SQL
    console.log('🔍 Checking if user exists...');
    const existingUsers: any[] = await prisma.$queryRaw`
      SELECT * FROM "User" WHERE email = ${testEmail}
    `;

    let userId: string;

    if (existingUsers.length > 0) {
      console.log('📝 User already exists, updating...');
      userId = existingUsers[0].id;
      
      // Update user
      await prisma.$executeRaw`
        UPDATE "User"
        SET 
          password = ${hashedPassword},
          name = ${testName},
          role = 'driver',
          "isActive" = true
        WHERE id = ${userId}
      `;
      console.log('✅ User updated\n');
    } else {
      console.log('➕ Creating new user...');
      
      // Generate ID
      const crypto = await import('crypto');
      userId = crypto.randomBytes(12).toString('base64url');
      
      // Create user
      await prisma.$executeRaw`
        INSERT INTO "User" (id, email, password, name, role, "isActive", "createdAt")
        VALUES (
          ${userId},
          ${testEmail},
          ${hashedPassword},
          ${testName},
          'driver',
          true,
          NOW()
        )
      `;
      console.log('✅ User created\n');
    }

    // Check if driver record exists
    console.log('🚗 Checking driver record...');
    const existingDrivers: any[] = await prisma.$queryRaw`
      SELECT * FROM "Driver" WHERE "userId" = ${userId}
    `;

    let driverId: string;

    if (existingDrivers.length > 0) {
      console.log('📝 Driver record exists, updating...');
      driverId = existingDrivers[0].id;
      
      // Update driver
      await prisma.$executeRaw`
        UPDATE "Driver"
        SET 
          "onboardingStatus" = 'approved',
          status = 'active',
          "vehicleType" = 'van',
          "basePostcode" = 'G1 1AA',
          rating = 5.0,
          strikes = 0
        WHERE id = ${driverId}
      `;
      console.log('✅ Driver record updated\n');
    } else {
      console.log('➕ Creating driver record...');
      
      // Generate ID
      const crypto = await import('crypto');
      driverId = crypto.randomBytes(12).toString('base64url');
      
      // Create driver
      await prisma.$executeRaw`
        INSERT INTO "Driver" (
          id, 
          "userId", 
          "onboardingStatus", 
          status, 
          "vehicleType", 
          "basePostcode", 
          rating, 
          strikes,
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${driverId},
          ${userId},
          'approved',
          'active',
          'van',
          'G1 1AA',
          5.0,
          0,
          NOW(),
          NOW()
        )
      `;
      console.log('✅ Driver record created\n');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Apple Review Test Driver Account Ready!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Email:    ', testEmail);
    console.log('🔑 Password: ', testPassword);
    console.log('👤 User ID:  ', userId);
    console.log('🚗 Driver ID:', driverId);
    console.log('📋 Status:    active');
    console.log('✅ Onboarding: approved');
    console.log('⭐ Rating:    5.0');
    console.log('🚐 Vehicle:   van');
    console.log('📍 Base:      G1 1AA');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Ready for Apple App Review!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📱 Test Login on iOS:');
    console.log('   Email:    zadfad41@gmail.com');
    console.log('   Password: 112233');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating Apple review driver:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAppleReviewDriver()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

