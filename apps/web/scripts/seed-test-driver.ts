/**
 * One-off helper to seed a development driver so admin assignment flows have data.
 * Safe to run multiple times; it upserts the user/driver and refreshes availability.
 */
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

async function main() {
  const email = 'testdriver.dev@speedy-van.co.uk';
  const name = 'Test Driver Dev';
  const plainPassword = 'TestDriver!123'; // dev-only password

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true },
  });

  const password = await bcrypt.hash(plainPassword, 12);

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        email,
        name,
        password,
        role: 'driver',
        emailVerified: true,
        isActive: true,
      },
    }));

  // Upsert driver core record
  const driver = await prisma.driver.upsert({
    where: { userId: user.id },
    update: {
      status: 'active',
      onboardingStatus: 'approved',
      rating: 4.9,
      basePostcode: 'N11 1AA',
    },
    create: {
      userId: user.id,
      status: 'active',
      onboardingStatus: 'approved',
      rating: 4.9,
      basePostcode: 'N11 1AA',
    },
    include: { DriverAvailability: true },
  });

  // Ensure availability is present and "online"
  await prisma.driverAvailability.upsert({
    where: { driverId: driver.id },
    update: {
      status: 'online',
      lastSeenAt: new Date(),
      lastLat: 51.5074,
      lastLng: -0.1278,
      locationConsent: true,
    },
    create: {
      driverId: driver.id,
      status: 'online',
      lastSeenAt: new Date(),
      lastLat: 51.5074,
      lastLng: -0.1278,
      locationConsent: true,
    },
  });

  console.log('✅ Seeded dev driver:', {
    userEmail: user.email,
    driverId: driver.id,
    availability: 'online',
    password: plainPassword,
  });
}

main()
  .catch((err) => {
    console.error('❌ Seeding failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

