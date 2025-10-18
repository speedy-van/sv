/**
 * Protected Prisma Client with Environment Validation
 * 
 * This is the NEW recommended way to import Prisma in the project.
 * It automatically validates the environment and blocks production database access in development.
 */

import { PrismaClient } from '@prisma/client';
import { 
  validateDatabaseEnvironment, 
  createProductionProtectionMiddleware,
  isProductionEnvironment,
  getEnvironmentInfo 
} from './db-protection';

// Global database client instance
declare global {
  // eslint-disable-next-line no-var
  var __prismaProtected: PrismaClient | undefined;
}

// Validate environment on module load
try {
  validateDatabaseEnvironment();
} catch (error) {
  // This will crash the app if there's an environment mismatch
  // which is EXACTLY what we want for safety
  console.error('❌ Database protection check failed:', error);
  throw error;
}

// Create protected Prisma client
export const prisma: PrismaClient = globalThis.__prismaProtected || new PrismaClient({
  log: isProductionEnvironment() 
    ? ['error'] 
    : ['query', 'error', 'warn'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Apply production protection middleware
// Note: $use middleware is deprecated in Prisma 5+
// We'll use the protection at connection time instead
if (typeof (prisma as any).$use === 'function') {
  (prisma as any).$use(createProductionProtectionMiddleware());
}

// Store in global for singleton pattern
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaProtected = prisma;
}

// Log environment info on startup
console.log('🔒 Protected Prisma Client Initialized:');
console.log(getEnvironmentInfo());

// Database connection utilities with retry logic
export async function connectDatabase(retries = 3): Promise<void> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log(`✅ Database connected successfully (attempt ${attempt}/${retries})`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`❌ Database connection failed (attempt ${attempt}/${retries}):`, error);
      
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
}

// Health check utility
export async function checkDatabaseHealth(autoReconnect = true): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    
    if (autoReconnect) {
      try {
        console.log('🔄 Attempting to reconnect to database...');
        await prisma.$disconnect();
        await connectDatabase();
        return true;
      } catch (reconnectError) {
        console.error('Failed to reconnect:', reconnectError);
        return false;
      }
    }
    
    return false;
  }
}

// Ensure connection is alive before critical operations
export async function ensureConnection(): Promise<void> {
  const isHealthy = await checkDatabaseHealth(true);
  if (!isHealthy) {
    throw new Error('Database connection unavailable');
  }
}

// Transaction utilities with proper typing
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback);
}

// Export the protected client as default
export default prisma;

