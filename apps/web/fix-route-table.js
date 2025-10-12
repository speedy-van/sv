const { Client } = require('pg');

// Connection string for Neon database
const connectionString = 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: connectionString,
});

async function fixRouteTable() {
  try {
    console.log('🔄 Fixing Route table schema...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Add missing columns to Route table
    const alterStatements = [
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "completedDrops" INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "serviceTier" TEXT',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "totalDrops" INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "timeWindowStart" TIMESTAMP',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "timeWindowEnd" TIMESTAMP',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "maxCapacityWeight" DECIMAL',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "maxCapacityVolume" DECIMAL',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "routeComplexityScore" INTEGER DEFAULT 1',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "customerSatisfactionTarget" DECIMAL',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "carbonFootprintKg" DECIMAL',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "routeNotes" TEXT',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "routeOptimizationVersion" TEXT DEFAULT \'1.0\'',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "trafficFactor" DECIMAL DEFAULT 1.0',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "weatherConditions" TEXT',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "totalEstimatedTime" INTEGER',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "breakTimeAllocated" INTEGER DEFAULT 0',
      'ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT'
    ];

    console.log('📋 Adding missing columns to Route table...');

    for (const statement of alterStatements) {
      try {
        await client.query(statement);
        console.log(`✅ Executed: ${statement.split('ADD COLUMN')[1]?.trim() || statement}`);
      } catch (error) {
        console.log(`⚠️  Failed: ${error.message}`);
      }
    }

    // Add missing columns to DriverEarnings table
    const earningsStatements = [
      'ALTER TABLE "DriverEarnings" ADD COLUMN IF NOT EXISTS "adminAdjustedAmountPence" INTEGER',
      'ALTER TABLE "DriverEarnings" ADD COLUMN IF NOT EXISTS "adminAdjustedAt" TIMESTAMP',
      'ALTER TABLE "DriverEarnings" ADD COLUMN IF NOT EXISTS "adminAdjustedBy" TEXT',
      'ALTER TABLE "DriverEarnings" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT'
    ];

    console.log('\n📋 Adding admin columns to DriverEarnings table...');

    for (const statement of earningsStatements) {
      try {
        await client.query(statement);
        console.log(`✅ Executed: ${statement.split('ADD COLUMN')[1]?.trim() || statement}`);
      } catch (error) {
        console.log(`⚠️  Failed: ${error.message}`);
      }
    }

    console.log('\n🎉 Route table schema fixed successfully!');

    // Verify Route table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Route' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('\n🛣️  Updated Route Table Columns:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('❌ Route table fix failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

fixRouteTable();
