import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.DEV_DRIVER_PASSWORD ?? 'Driver123!';

type DriverSeed = {
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  basePostcode: string;
  location: {
    lat: number;
    lng: number;
    label: string;
  };
  availabilityStatus?: 'online' | 'offline' | 'busy';
  rating?: number;
  password?: string;
};

const driverSeeds: DriverSeed[] = [
  {
    name: 'Hannah Lewis',
    email: 'driver.hannah.lewis+dev@speedy-van.dev',
    phone: '+44 7700 900101',
    vehicleType: 'large_van',
    basePostcode: 'SW1A 1AA',
    location: { lat: 51.5074, lng: -0.1278, label: 'Westminster' },
    availabilityStatus: 'online',
    rating: 4.9,
  },
  {
    name: 'Omar Singh',
    email: 'driver.omar.singh+dev@speedy-van.dev',
    phone: '+44 7700 900102',
    vehicleType: 'medium_van',
    basePostcode: 'E1 6AN',
    location: { lat: 51.5194, lng: -0.0741, label: 'Shoreditch' },
    availabilityStatus: 'online',
    rating: 4.7,
  },
  {
    name: 'Charlotte Green',
    email: 'driver.charlotte.green+dev@speedy-van.dev',
    phone: '+44 7700 900103',
    vehicleType: 'luton_van',
    basePostcode: 'NW1 5DB',
    location: { lat: 51.5237, lng: -0.1586, label: 'Camden' },
    availabilityStatus: 'online',
    rating: 4.8,
  },
  {
    name: 'Lucas Barrett',
    email: 'driver.lucas.barrett+dev@speedy-van.dev',
    phone: '+44 7700 900104',
    vehicleType: 'medium_van',
    basePostcode: 'SE1 7PB',
    location: { lat: 51.5033, lng: -0.1195, label: 'Waterloo' },
    availabilityStatus: 'busy',
    rating: 4.6,
  },
  {
    name: 'Isla Murphy',
    email: 'driver.isla.murphy+dev@speedy-van.dev',
    phone: '+44 7700 900105',
    vehicleType: 'small_van',
    basePostcode: 'W1B 3AG',
    location: { lat: 51.5152, lng: -0.1419, label: 'Oxford Circus' },
    availabilityStatus: 'offline',
    rating: 4.5,
  },
];

async function upsertDriver(seed: DriverSeed) {
  const hashedPassword = await hash(seed.password ?? DEFAULT_PASSWORD, 12);
  const now = new Date();

  const user = await prisma.user.upsert({
    where: { email: seed.email },
    update: {
      name: seed.name,
      phone: seed.phone,
      role: 'driver',
      password: hashedPassword,
      emailVerified: true,
      isActive: true,
      lastLogin: now,
    },
    create: {
      email: seed.email,
      name: seed.name,
      phone: seed.phone,
      role: 'driver',
      password: hashedPassword,
      emailVerified: true,
      isActive: true,
      lastLogin: now,
    },
    select: {
      id: true,
    },
  });

  const driver = await prisma.driver.upsert({
    where: { userId: user.id },
    update: {
      status: 'active',
      onboardingStatus: 'approved',
      basePostcode: seed.basePostcode,
      vehicleType: seed.vehicleType,
      rating: seed.rating ?? 4.5,
      approvedAt: now,
    },
    create: {
      userId: user.id,
      status: 'active',
      onboardingStatus: 'approved',
      basePostcode: seed.basePostcode,
      vehicleType: seed.vehicleType,
      rating: seed.rating ?? 4.5,
      approvedAt: now,
    },
    select: {
      id: true,
    },
  });

  await prisma.driverAvailability.upsert({
    where: { driverId: driver.id },
    update: {
      status: seed.availabilityStatus ?? 'online',
      lastSeenAt: now,
      lastLat: seed.location.lat,
      lastLng: seed.location.lng,
      locationConsent: true,
    },
    create: {
      driverId: driver.id,
      status: seed.availabilityStatus ?? 'online',
      lastSeenAt: now,
      lastLat: seed.location.lat,
      lastLng: seed.location.lng,
      locationConsent: true,
    },
  });

  return { userId: user.id, driverId: driver.id };
}

async function main() {
  console.log('🚚 Ensuring development drivers exist...\n');

  for (const seed of driverSeeds) {
    const ids = await upsertDriver(seed);
    console.log(
      `• ${seed.name} -> user ${ids.userId} / driver ${ids.driverId} (${seed.basePostcode}, ${seed.vehicleType})`,
    );
  }

  const driverCount = await prisma.driver.count({
    where: {
      status: 'active',
      onboardingStatus: 'approved',
    },
  });

  console.log('\n✅ Driver seed complete');
  console.log(`   Active + approved drivers in DB: ${driverCount}`);
  console.log(`   Default password: ${DEFAULT_PASSWORD}`);
  console.log(
    '   You can override the password by setting DEV_DRIVER_PASSWORD before running the script.\n',
  );
}

main()
  .catch(error => {
    console.error('❌ Failed to create test drivers', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

