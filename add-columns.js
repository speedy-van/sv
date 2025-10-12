const path = require('path');

let Client;

try {
  ({ Client } = require('pg'));
} catch (error) {
  const fallbackModule = path.join(__dirname, 'apps', 'web', 'node_modules', 'pg');
  ({ Client } = require(fallbackModule));
}

function describeStatement(statement) {
  const columnMatch = statement.match(/ADD COLUMN IF NOT EXISTS "([^"]+)"/);
  if (columnMatch) {
    return columnMatch[1];
  }

  const indexMatch = statement.match(/CREATE INDEX IF NOT EXISTS "([^"]+)"/);
  if (indexMatch) {
    return indexMatch[1];
  }

  return 'statement';
}

async function addMissingColumns() {
  const client = new Client({
    connectionString:
      'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    console.log('🔄 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('📋 Adding missing columns...');

    const statements = [
      // Driver availability enhancements
      `ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "breakUntil" TIMESTAMPTZ;`,
      `ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "maxConcurrentDrops" INTEGER DEFAULT 5;`,
      `ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "preferredServiceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[];`,
      `ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "multiDropCapable" BOOLEAN DEFAULT true;`,
      `ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "currentCapacityUsed" INTEGER DEFAULT 0;`,
      `ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "experienceLevel" TEXT DEFAULT 'standard';`,
      `ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "routePreferences" JSONB DEFAULT '{}'::jsonb;`,
      `CREATE INDEX IF NOT EXISTS "DriverAvailability_status_multiDropCapable_currentCapacityUsed_maxConcurrentDrops_idx" ON "DriverAvailability" ("status", "multiDropCapable", "currentCapacityUsed", "maxConcurrentDrops");`,

      // Booking workflow extensions
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "currentStep" TEXT DEFAULT 'STEP_1_WHERE_AND_WHAT';`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "isStepCompleted" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "stepCompletedAt" TIMESTAMPTZ;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "isMultiDrop" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "routeId" TEXT;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "priorityLevel" SMALLINT DEFAULT 1;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "estimatedPickupTime" TIMESTAMPTZ;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "estimatedDeliveryTime" TIMESTAMPTZ;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualPickupTime" TIMESTAMPTZ;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualDeliveryTime" TIMESTAMPTZ;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "deliverySequence" INTEGER;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "specialHandling" TEXT[] DEFAULT ARRAY[]::TEXT[];`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "timeWindowFlexibility" INTEGER DEFAULT 30;`,
      `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "customerPreferences" JSONB DEFAULT '{}'::jsonb;`,
      `CREATE INDEX IF NOT EXISTS "Booking_currentStep_status_idx" ON "Booking" ("currentStep", "status");`,
      `CREATE INDEX IF NOT EXISTS "Booking_isMultiDrop_status_estimatedPickupTime_idx" ON "Booking" ("isMultiDrop", "status", "estimatedPickupTime");`,
      `CREATE INDEX IF NOT EXISTS "Booking_routeId_deliverySequence_status_idx" ON "Booking" ("routeId", "deliverySequence", "status");`
    ];

    let executedCount = 0;
    let failedCount = 0;

    for (const statement of statements) {
      try {
        await client.query(statement);
        executedCount++;
        console.log(`✅ Executed: ${describeStatement(statement)}`);
      } catch (error) {
        failedCount++;
        console.log(`⚠️  Failed: ${describeStatement(statement)} - ${error.message}`);
      }
    }

    console.log(`📊 Migration results: ${executedCount} successful, ${failedCount} failed`);

    if (executedCount > 0) {
      console.log('🎉 Columns added successfully!');
      console.log('📊 Updated entities:');
      console.log('  - DriverAvailability (breakUntil, maxConcurrentDrops, preferredServiceAreas, multiDropCapable, currentCapacityUsed, experienceLevel, routePreferences)');
      console.log('  - Booking (currentStep, isStepCompleted, stepCompletedAt, isMultiDrop, routeId, priorityLevel, estimated/actual pickup & delivery timestamps, deliverySequence, specialHandling, timeWindowFlexibility, customerPreferences)');
      console.log('  - Supporting performance indexes');
    } else {
      console.log('⚠️  All columns already exist');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

addMissingColumns();