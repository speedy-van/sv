const { Client } = require('pg');

// Connection string for Neon database
const connectionString = 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/customer_ai_db?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: connectionString,
});

async function connectToDB() {
  try {
    console.log('🔄 Connecting to Neon database...');
    await client.connect();

    console.log('✅ Connected successfully!');

    // Get database info
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log('\n📊 Database Information:');
    console.log('Database:', dbInfo.rows[0].current_database);
    console.log('User:', dbInfo.rows[0].current_user);
    console.log('Version:', dbInfo.rows[0].version.split(' ')[0] + ' ' + dbInfo.rows[0].version.split(' ')[1]);

    // List all tables
    const tables = await client.query(`
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename
    `);

    console.log('\n📋 Available Tables:');
    tables.rows.forEach(table => {
      console.log(`  ${table.schemaname}.${table.tablename}`);
    });

    // Check for admin routes table specifically
    const routeTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%route%'
      ORDER BY table_name
    `);

    console.log('\n🛣️  Route-related Tables:');
    if (routeTables.rows.length > 0) {
      routeTables.rows.forEach(table => {
        console.log(`  ${table.table_name}`);
      });
    } else {
      console.log('  No route tables found');
    }

    // Check for driver earnings tables
    const earningsTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%earning%'
      ORDER BY table_name
    `);

    console.log('\n💰 Earnings-related Tables:');
    if (earningsTables.rows.length > 0) {
      earningsTables.rows.forEach(table => {
        console.log(`  ${table.table_name}`);
      });
    } else {
      console.log('  No earnings tables found');
    }

    console.log('\n🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

connectToDB();
