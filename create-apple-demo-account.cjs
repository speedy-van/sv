const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Use the database URL directly (from user rules)
const DATABASE_URL = 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function createAppleDemoAccount() {
  try {
    console.log('🍎 Creating Apple demo account for iOS app review...');
    
    // Demo account details from Apple review rejection
    const demoEmail = 'zadfad41@gmail.com';
    const demoPassword = '112233';
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: demoEmail,
          mode: 'insensitive'
        }
      },
      include: {
        driver: true
      }
    });

    if (existingUser) {
      console.log('⚠️ User already exists with ID:', existingUser.id);
      console.log('Updating password and ensuring proper driver setup...');
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(demoPassword, 12);
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          role: 'driver',
          name: 'Apple Demo Driver',
          phone: '07901846297',
          verified: true
        }
      });
      
      console.log('✅ Updated existing user');
      
      // Update or create driver profile
      if (existingUser.driver) {
        await prisma.driver.update({
          where: { id: existingUser.driver.id },
          data: {
            status: 'active',
            onboardingStatus: 'approved',
            vehicleType: 'van',
            basePostcode: 'G21 2QB',
            rating: 5.0,
            strikes: 0,
            availability: true
          }
        });
        console.log('✅ Updated existing driver profile');
      } else {
        await prisma.driver.create({
          data: {
            userId: existingUser.id,
            status: 'active',
            onboardingStatus: 'approved',
            vehicleType: 'van',
            basePostcode: 'G21 2QB',
            rating: 5.0,
            strikes: 0,
            availability: true
          }
        });
        console.log('✅ Created new driver profile for existing user');
      }
      
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(demoPassword, 12);
      
      // Create new user with driver profile
      const newUser = await prisma.user.create({
        data: {
          email: demoEmail,
          name: 'Apple Demo Driver',
          password: hashedPassword,
          role: 'driver',
          phone: '07901846297',
          verified: true,
          driver: {
            create: {
              status: 'active',
              onboardingStatus: 'approved',
              vehicleType: 'van',
              basePostcode: 'G21 2QB',
              rating: 5.0,
              strikes: 0,
              availability: true
            }
          }
        },
        include: {
          driver: true
        }
      });
      
      console.log('✅ Created new user and driver profile with ID:', newUser.id);
    }
    
    // Verify the account was created properly
    const finalUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: demoEmail,
          mode: 'insensitive'
        }
      },
      include: {
        driver: true
      }
    });

    if (!finalUser || !finalUser.driver) {
      throw new Error('Failed to create proper account setup');
    }

    console.log('\n🎯 Apple Demo Account is ready for iOS app review:');
    console.log('════════════════════════════════════════════════');
    console.log('Email:', demoEmail);
    console.log('Password:', demoPassword);
    console.log('User ID:', finalUser.id);
    console.log('Driver ID:', finalUser.driver.id);
    console.log('Role:', finalUser.role);
    console.log('Onboarding Status:', finalUser.driver.onboardingStatus);
    console.log('Driver Status:', finalUser.driver.status);
    console.log('Available:', finalUser.driver.availability);
    console.log('════════════════════════════════════════════════');
    console.log('✅ Apple reviewers can now login to the iOS Driver App!');
    console.log('🚀 Ready for TestFlight submission');

  } catch (error) {
    console.error('❌ Error creating Apple demo account:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAppleDemoAccount();
