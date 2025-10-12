const { Client } = require('pg');

// Connection string for Neon database
const connectionString = 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: connectionString,
});

async function checkTables() {
  try {
    console.log('🔄 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Check what tables exist
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 All Tables in Database:');
    tables.rows.forEach(table => {
      console.log(`  ${table.table_name}`);
    });

    // Specifically check for Route table
    const routeExists = tables.rows.some(table => table.table_name === 'Route');
    console.log(`\n🛣️  Route table exists: ${routeExists ? '✅ YES' : '❌ NO'}`);

    // Check for admin-related tables
    const adminTables = tables.rows.filter(table =>
      table.table_name.includes('Admin') ||
      table.table_name.includes('Approval') ||
      table.table_name.includes('Bonus')
    );

    console.log('\n👑 Admin-related Tables:');
    if (adminTables.length > 0) {
      adminTables.forEach(table => {
        console.log(`  ${table.table_name}`);
      });
    } else {
      console.log('  No admin-related tables found');
    }

    // Check Route table structure if it exists
    if (routeExists) {
      const routeColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Route' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      console.log('\n🛣️  Route Table Columns:');
      routeColumns.rows.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

checkTables();
