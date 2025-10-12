import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { Client } = require('./apps/web/node_modules/pg');

async function fixDatabase() {
  console.log('🔄 Starting database migration...');

  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const statements = [
      { sql: 'ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "breakUntil" TIMESTAMPTZ', name: 'DriverAvailability.breakUntil' },
      { sql: 'ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "maxConcurrentDrops" INTEGER DEFAULT 5', name: 'DriverAvailability.maxConcurrentDrops' },
      { sql: 'ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "preferredServiceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[]', name: 'DriverAvailability.preferredServiceAreas' },
      { sql: 'ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "multiDropCapable" BOOLEAN DEFAULT true', name: 'DriverAvailability.multiDropCapable' },
      { sql: 'ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "currentCapacityUsed" INTEGER DEFAULT 0', name: 'DriverAvailability.currentCapacityUsed' },
      { sql: 'ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "experienceLevel" TEXT DEFAULT \'standard\'', name: 'DriverAvailability.experienceLevel' },
      { sql: 'ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "routePreferences" JSONB DEFAULT \'{}\'::jsonb', name: 'DriverAvailability.routePreferences' },
      { sql: 'CREATE INDEX IF NOT EXISTS "DriverAvailability_status_multiDropCapable_currentCapacityUsed_maxConcurrentDrops_idx" ON "DriverAvailability" ("status", "multiDropCapable", "currentCapacityUsed", "maxConcurrentDrops")', name: 'DriverAvailability status/multiDrop index' },

      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "currentStep" TEXT DEFAULT \'STEP_1_WHERE_AND_WHAT\'', name: 'Booking.currentStep' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "isStepCompleted" BOOLEAN DEFAULT false', name: 'Booking.isStepCompleted' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "stepCompletedAt" TIMESTAMPTZ', name: 'Booking.stepCompletedAt' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "isMultiDrop" BOOLEAN DEFAULT false', name: 'Booking.isMultiDrop' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "routeId" TEXT', name: 'Booking.routeId' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "priorityLevel" SMALLINT DEFAULT 1', name: 'Booking.priorityLevel' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "estimatedPickupTime" TIMESTAMPTZ', name: 'Booking.estimatedPickupTime' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "estimatedDeliveryTime" TIMESTAMPTZ', name: 'Booking.estimatedDeliveryTime' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualPickupTime" TIMESTAMPTZ', name: 'Booking.actualPickupTime' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualDeliveryTime" TIMESTAMPTZ', name: 'Booking.actualDeliveryTime' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "deliverySequence" INTEGER', name: 'Booking.deliverySequence' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "specialHandling" TEXT[] DEFAULT ARRAY[]::TEXT[]', name: 'Booking.specialHandling' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "timeWindowFlexibility" INTEGER DEFAULT 30', name: 'Booking.timeWindowFlexibility' },
      { sql: 'ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "customerPreferences" JSONB DEFAULT \'{}\'::jsonb', name: 'Booking.customerPreferences' },
      { sql: 'CREATE INDEX IF NOT EXISTS "Booking_currentStep_status_idx" ON "Booking" ("currentStep", "status")', name: 'Booking currentStep/status index' },
      { sql: 'CREATE INDEX IF NOT EXISTS "Booking_isMultiDrop_status_estimatedPickupTime_idx" ON "Booking" ("isMultiDrop", "status", "estimatedPickupTime")', name: 'Booking multiDrop/status index' },
      { sql: 'CREATE INDEX IF NOT EXISTS "Booking_routeId_deliverySequence_status_idx" ON "Booking" ("routeId", "deliverySequence", "status")', name: 'Booking routeId/status index' }
    ];

    let added = 0;
    let skipped = 0;

    for (const { sql, name } of statements) {
      try {
        await client.query(sql);
        console.log(`✅ Added: ${name}`);
        added++;
      } catch (error) {
        if (error.code === '42701' || error.code === '42P07') { // Column or index already exists
          console.log(`⚠️  Skipped: ${name} (already exists)`);
          skipped++;
        } else {
          console.log(`❌ Failed: ${name} - ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Added: ${added} columns`);
    console.log(`   Skipped: ${skipped} columns`);
    console.log(`🎉 Database migration completed!`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

fixDatabase();
