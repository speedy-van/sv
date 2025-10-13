import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

// Read .env.local file and set environment variables
try {
  const envContent = readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key] = value;
        console.log(`Set ${key}=${value.substring(0, 50)}...`);
      }
    }
  });
} catch (error) {
  console.error('Error reading .env.local:', error.message);
}

// Force set DATABASE_URL to Neon database URL with proper pooling parameters
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connection_limit=100&pool_timeout=30&connect_timeout=30';

// Always use the Neon database URL
process.env.DATABASE_URL = NEON_DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: NEON_DATABASE_URL,
    },
  },
});

prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
    return prisma.$queryRaw`SELECT 1`;
  })
  .then(() => {
    console.log('✅ Database query executed successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  })
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
