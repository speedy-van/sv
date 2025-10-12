const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Add essential missing columns
    await client.query('ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "maxConcurrentDrops" INTEGER DEFAULT 5');
    console.log('✅ Added maxConcurrentDrops');

    await client.query('ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "multiDropCapable" BOOLEAN DEFAULT true');
    console.log('✅ Added multiDropCapable');

    await client.query('ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "isMultiDrop" BOOLEAN DEFAULT false');
    console.log('✅ Added isMultiDrop to Booking');

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

run();