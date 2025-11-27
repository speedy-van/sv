import { PrismaClient } from '@prisma/client';

// Production database connection
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
});

// Development database connection
const developmentPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_kFhAEzKB6v7d@ep-round-morning-afkxnska-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
});

async function copyDrivers() {
  try {
    console.log('🔍 Fetching drivers from Production...');
    
    // Get all drivers from Production
    const productionDrivers = await productionPrisma.user.findMany({
      where: {
        role: 'driver',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        password: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        driver: {
          select: {
            status: true,
            onboardingStatus: true,
            basePostcode: true,
            vehicleType: true,
            rating: true,
            strikes: true,
            createdAt: true,
          }
        }
      },
    });

    console.log(`✅ Found ${productionDrivers.length} drivers in Production`);

    if (productionDrivers.length === 0) {
      console.log('⚠️ No drivers found in Production');
      return;
    }

    console.log('📋 Copying drivers to Development...');

    let copied = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of productionDrivers) {
      try {
        // Check if user already exists in Development
        const existingUser = await developmentPrisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          console.log(`⏭️  Skipping ${user.email} - already exists`);
          skipped++;
          continue;
        }

        // Create user in Development
        const newUser = await developmentPrisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            phone: user.phone,
            password: user.password, // Copy hashed password
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          },
        });

        console.log(`✅ Created user: ${user.email}`);

        // Create driver record if exists
        if (user.driver) {
          await developmentPrisma.driver.create({
            data: {
              userId: newUser.id,
              status: user.driver.status,
              onboardingStatus: user.driver.onboardingStatus,
              basePostcode: user.driver.basePostcode,
              vehicleType: user.driver.vehicleType,
              rating: user.driver.rating,
              strikes: user.driver.strikes || 0,
              createdAt: user.driver.createdAt,
            },
          });
          console.log(`✅ Created driver record for: ${user.email}`);
        }

        copied++;
      } catch (error) {
        console.error(`❌ Error copying ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Copied: ${copied}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📦 Total: ${productionDrivers.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await productionPrisma.$disconnect();
    await developmentPrisma.$disconnect();
  }
}

copyDrivers();

