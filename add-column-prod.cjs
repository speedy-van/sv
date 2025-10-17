const { Client } = require('pg');

async function addColumnToProd() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Connecting to production database...');
    await client.connect();

    console.log('🔍 Checking if optimizationScore column exists...');
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Route'
      AND table_schema = 'public'
      AND column_name = 'optimizationScore'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ optimizationScore column already exists');
      return;
    }

    console.log('📝 Adding optimizationScore column...');
    await client.query('ALTER TABLE "Route" ADD COLUMN "optimizationScore" FLOAT DEFAULT 0');

    console.log('✅ Successfully added optimizationScore column');

    // Verify
    const verifyResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Route'
      AND table_schema = 'public'
      AND column_name = 'optimizationScore'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Column verification successful');
    } else {
      console.log('❌ Column verification failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

addColumnToProd();


