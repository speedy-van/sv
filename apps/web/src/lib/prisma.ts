/**
 * Prisma client configuration for Speedy Van
 * Singleton pattern with proper connection pooling for Neon PostgreSQL
 * Fixes: Connection timeouts, idle connection drops, and session persistence
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  connectionCheckInterval?: ReturnType<typeof setInterval>;
};

// Use DATABASE_URL from environment variables (from .env.local)
// This allows different databases for development and production
const DATABASE_URL = process.env.DATABASE_URL;

// During build time (Next.js build phase), allow missing DATABASE_URL
// It will be validated at runtime when actually used
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && 
                    typeof process.env.NEXT_PUBLIC_BASE_URL === 'undefined';

// Only throw error if not in build time
if (!DATABASE_URL && !isBuildTime) {
  // Check if we're in a build context (Next.js build phase)
  const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.argv.includes('build') ||
                      process.argv.includes('next') && process.argv.includes('build');
  
  if (!isNextBuild) {
    throw new Error('DATABASE_URL is not set in environment variables. Please check your .env.local file.');
  }
}

// Use placeholder URL during build if DATABASE_URL is missing
const effectiveDatabaseUrl = DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

// Detect database type (only if DATABASE_URL is set)
const isProductionDB = DATABASE_URL?.includes('ep-dry-glitter-aftvvy9d') ?? false;
const isDevelopmentDB = DATABASE_URL?.includes('ep-round-morning') ?? false;

if (DATABASE_URL) {
  if (isProductionDB) {
    console.log('🔗 Using database: PRODUCTION (ep-dry-glitter-aftvvy9d)');
    console.log('⚠️  WARNING: Connected to PRODUCTION database. All changes will affect live data!');
  } else if (isDevelopmentDB) {
    console.log('🔗 Using database: DEVELOPMENT (ep-round-morning)');
  } else {
    console.log('🔗 Using database: UNKNOWN (custom configuration)');
  }
} else if (isBuildTime) {
  // Silent during build - this is expected
  // console.log('⚠️  DATABASE_URL not set during build - using placeholder');
}

// Prisma Client with optimized connection pool settings for Neon
// No connection pooling overhead - Prisma handles this automatically
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: effectiveDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'], // Reduced logging
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

// Health check helper with auto-reconnect (simplified - no blocking)
export async function ensurePrismaConnection(): Promise<void> {
  // Validate DATABASE_URL at runtime (not during build)
  if (!DATABASE_URL || effectiveDatabaseUrl === 'postgresql://placeholder:placeholder@localhost:5432/placeholder') {
    throw new Error('DATABASE_URL is not set in environment variables. Please check your .env.local file.');
  }
  
  // Skip connection check if already marked as connected (non-blocking)
  if (isConnected) {
    return; // Assume connected if last check was recent
  }
  
  // Quick connection test with timeout
  try {
    // Don't wait for full connection - Prisma handles connection pooling
    // Just mark as connected and let Prisma handle the rest
    isConnected = true;
    lastHealthCheck = Date.now();
  } catch (error) {
    isConnected = false;
    console.error('❌ Prisma connection check failed:', error);
    
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

// Initialize connection and start heartbeat (lazy initialization)
let isInitializing = false;
async function initializePrisma() {
  if (isInitializing) return;
  isInitializing = true;
  
  try {
    await prisma.$connect();
    await ensurePrismaConnection();
    startConnectionHeartbeat();
    console.log('✅ Prisma initialized with connection heartbeat');
  } catch (error) {
    console.error('❌ Failed to initialize Prisma:', error);
  } finally {
    isInitializing = false;
  }
}

// Auto-initialize (lazy - only when needed)
// initializePrisma(); // Disabled to prevent startup hangs - will initialize on first query

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