const { Client } = require('pg');

async function addOptimizationScoreToProd() {
  // Use production DATABASE_URL from env
  const databaseUrl = process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  const client = new Client({
    connectionString: databaseUrl,
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
      console.log('✅ optimizationScore column already exists in production');
      return;
    }

    console.log('📝 Adding optimizationScore column to production Route table...');
    await client.query(`
      ALTER TABLE "Route" ADD COLUMN "optimizationScore" FLOAT DEFAULT 0
    `);

    console.log('✅ Successfully added optimizationScore column to production');

    // Verify
    const verifyResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Route'
      AND table_schema = 'public'
      AND column_name = 'optimizationScore'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Column verification successful in production');
    } else {
      console.log('❌ Column verification failed in production');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('🔌 Production database connection closed');
  }
}

addOptimizationScoreToProd();


