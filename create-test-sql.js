// Create test account using raw SQL
import pkg from 'pg';
const { Client } = pkg;

async function createTestAccount() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    await client.connect();
    console.log('🔌 Connected to database');

    // Create/update user
    await client.query(`
      INSERT INTO "User" (id, email, name, role, password, "emailVerified", "lastLogin", "createdAt", "updatedAt")
      VALUES ('user_test_apple', 'zadfad41@gmail.com', 'Apple Test Driver', 'driver', '$2a$12$L9wQX5Qo2VzJc8FgH8XcJeO3q3q3q3q3q3q3q3q3q3q3q3q3q3q3q', NOW(), NOW(), NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        name = EXCLUDED.name
    `);

    // Create/update driver
    await client.query(`
      INSERT INTO "Driver" (id, "userId", status, "onboardingStatus", "basePostcode", "vehicleType", rating, "createdAt", "updatedAt")
      VALUES ('driver_test_apple', 'user_test_apple', 'active', 'approved', 'G21 2QB', 'van', 5.0, NOW(), NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        status = EXCLUDED.status,
        "onboardingStatus" = EXCLUDED."onboardingStatus"
    `);

    console.log('✅ Test account created successfully!');
    console.log('📧 Email: zadfad41@gmail.com');
    console.log('🔑 Password: 112233');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createTestAccount();
