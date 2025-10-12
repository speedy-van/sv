const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    console.log('🔄 Connecting to Neon database for migration...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('📄 Reading migration file...');
    const migrationSQL = fs.readFileSync('migration.sql', 'utf8');

    console.log('⚡ Executing migration...');

    // Split SQL into individual statements and execute them
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);

    let executedCount = 0;
    let failedCount = 0;

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement.trim() + ';');
          executedCount++;
          console.log(`✅ Executed: ${statement.trim().substring(0, 50)}...`);
        } catch (error) {
          failedCount++;
          console.log(`⚠️  Failed (${error.code}): ${statement.trim().substring(0, 50)}...`);
        }
      }
    }

    console.log(`📊 Migration results: ${executedCount} successful, ${failedCount} failed`);

    if (executedCount > 0) {
      console.log('🎉 Migration completed!');
      console.log('📊 Added columns:');
      console.log('  - DriverAvailability.maxConcurrentDrops');
      console.log('  - DriverAvailability.preferredServiceAreas');
      console.log('  - DriverAvailability.multiDropCapable');
      console.log('  - DriverAvailability.currentCapacityUsed');
      console.log('  - DriverAvailability.experienceLevel');
      console.log('  - DriverAvailability.routePreferences');
      console.log('  - Booking.isMultiDrop');
    } else {
      console.log('⚠️  No columns were added - they might already exist');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration();
