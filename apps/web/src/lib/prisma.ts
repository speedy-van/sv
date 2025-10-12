/**
 * Prisma client configuration for Speedy Van
 * Singleton pattern with proper connection pooling for Neon PostgreSQL
 * Fixes: Connection timeouts, idle connection drops, and session persistence
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  connectionCheckInterval?: NodeJS.Timeout;
};

// Force set DATABASE_URL to Neon database URL with proper pooling parameters
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connection_limit=100&pool_timeout=30&connect_timeout=30';

// Always use the Neon database URL
process.env.DATABASE_URL = NEON_DATABASE_URL;

// Prisma Client with optimized connection pool settings for Neon
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: NEON_DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection health tracking
let isConnected = false;
let lastHealthCheck = Date.now();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds (more frequent for Neon)

// Health check helper with auto-reconnect
export async function ensurePrismaConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    reconnectAttempts = 0;
    lastHealthCheck = Date.now();
  } catch (error) {
    isConnected = false;
    console.error('❌ Prisma connection lost, attempting reconnect...', error);
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`🔄 Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
      
      try {
        await prisma.$disconnect();
        await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        
        isConnected = true;
        reconnectAttempts = 0;
        console.log('✅ Prisma reconnected successfully');
      } catch (reconnectError) {
        console.error(`❌ Reconnect attempt ${reconnectAttempts} failed:`, reconnectError);
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error('❌ Max reconnect attempts reached. Manual intervention required.');
          throw new Error('Database connection failed after maximum retry attempts');
        }
        
        throw reconnectError;
      }
    } else {
      throw new Error('Database connection unavailable');
    }
  }
}

// Get connection status
export function getConnectionStatus() {
  return {
    isConnected,
    lastHealthCheck,
    reconnectAttempts,
    timeSinceLastCheck: Date.now() - lastHealthCheck,
  };
}

// Heartbeat to keep connection alive (prevents Neon idle timeout)
function startConnectionHeartbeat() {
  if (globalForPrisma.connectionCheckInterval) {
    return; // Already running
  }

  console.log('💓 Starting database connection heartbeat...');
  
  globalForPrisma.connectionCheckInterval = setInterval(async () => {
    try {
      await ensurePrismaConnection();
      // console.log('💓 Heartbeat: Connection alive');
    } catch (error) {
      console.error('💔 Heartbeat: Connection check failed', error);
    }
  }, HEALTH_CHECK_INTERVAL);
}

// Initialize connection and start heartbeat
async function initializePrisma() {
  try {
    await prisma.$connect();
    await ensurePrismaConnection();
    startConnectionHeartbeat();
    console.log('✅ Prisma initialized with connection heartbeat');
  } catch (error) {
    console.error('❌ Failed to initialize Prisma:', error);
  }
}

// Auto-initialize
initializePrisma();

// Graceful shutdown
const shutdownPrisma = async () => {
  console.log('🔄 Shutting down Prisma...');
  
  if (globalForPrisma.connectionCheckInterval) {
    clearInterval(globalForPrisma.connectionCheckInterval);
    globalForPrisma.connectionCheckInterval = undefined;
  }
  
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected cleanly');
  } catch (error) {
    console.error('❌ Error disconnecting Prisma:', error);
  }
};

process.on('SIGINT', shutdownPrisma);
process.on('SIGTERM', shutdownPrisma);
process.on('beforeExit', shutdownPrisma);

// Export helper to use in API routes
export async function withPrisma<T>(
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  await ensurePrismaConnection();
  return callback(prisma);
}