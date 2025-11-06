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

// Suppress "connection closed" errors from Prisma console output
// Prisma logs errors directly to stderr even when logging is disabled
// We intercept both console.error and process.stderr.write
const originalConsoleError = console.error;
const originalStderrWrite = process.stderr.write;
let isPrismaErrorSuppressionEnabled = true;

// Only intercept if not already intercepted (prevent double wrapping)
if (!(console.error as any).__prismaIntercepted) {
  // Intercept console.error
  console.error = (...args: any[]) => {
    // Check if this is a Prisma connection closed error
    const message = args.join(' ');
    const isPrismaConnectionError = 
      message.includes('prisma:error') &&
      (message.includes('Error in PostgreSQL connection') || 
       message.includes('Closed') ||
       message.includes('connection'));
    
    // Suppress Prisma connection closed errors - they are handled by reconnect logic
    if (isPrismaErrorSuppressionEnabled && isPrismaConnectionError) {
      return; // Suppress the error
    }
    
    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };
  
  // Intercept process.stderr.write (Prisma uses this directly)
  process.stderr.write = function(chunk: any, encoding?: any, callback?: any): boolean {
    const message = String(chunk);
    const isPrismaConnectionError = 
      message.includes('prisma:error') &&
      (message.includes('Error in PostgreSQL connection') || 
       message.includes('Closed') ||
       message.includes('connection'));
    
    // Suppress Prisma connection closed errors
    if (isPrismaErrorSuppressionEnabled && isPrismaConnectionError) {
      return true; // Suppress the error
    }
    
    // Write all other errors normally
    return originalStderrWrite.call(process.stderr, chunk, encoding, callback);
  };
  
  // Mark as intercepted to prevent double wrapping
  (console.error as any).__prismaIntercepted = true;
}

// Prisma Client with optimized connection pool settings for Neon
// Enhanced error handling for connection closed errors
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: effectiveDatabaseUrl,
      },
    },
    // Disable Prisma error logging - we handle errors ourselves
    log: [], // Disable all Prisma logging to prevent "connection closed" errors from appearing
    errorFormat: 'pretty',
  });

// Export function to enable/disable error suppression (for debugging)
export function setPrismaErrorSuppression(enabled: boolean) {
  isPrismaErrorSuppressionEnabled = enabled;
}

// Wrapper function to handle Prisma queries with automatic retry on connection errors
export async function prismaQuery<T>(
  query: () => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await ensurePrismaConnection();
      return await query();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error
      const isConnectionError = error?.message?.includes('Closed') || 
                               error?.message?.includes('connection') ||
                               error?.code === 'P1001' ||
                               error?.kind === 'Closed';
      
      if (isConnectionError && attempt < retries) {
        console.log(`🔄 Retrying Prisma query (attempt ${attempt + 1}/${retries})...`);
        // Wait before retry with exponential backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Reset connection state to force reconnect
        isConnected = false;
        continue;
      }
      
      // Not a connection error or max retries reached
      throw error;
    }
  }
  
  throw lastError;
}

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

// Health check helper with auto-reconnect (enhanced for Neon PostgreSQL)
export async function ensurePrismaConnection(): Promise<void> {
  // Validate DATABASE_URL at runtime (not during build)
  if (!DATABASE_URL || effectiveDatabaseUrl === 'postgresql://placeholder:placeholder@localhost:5432/placeholder') {
    throw new Error('DATABASE_URL is not set in environment variables. Please check your .env.local file.');
  }
  
  // Skip connection check if already marked as connected and recent (within 5 seconds)
  const timeSinceLastCheck = Date.now() - lastHealthCheck;
  if (isConnected && timeSinceLastCheck < 5000) {
    return; // Assume connected if last check was recent
  }
  
  // Test connection with actual query
  try {
    // Use a lightweight query to test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    isConnected = true;
    lastHealthCheck = Date.now();
    reconnectAttempts = 0; // Reset on successful connection
  } catch (error: any) {
    isConnected = false;
    
    // Check if error is a connection closed error
    const isConnectionError = error?.message?.includes('Closed') || 
                             error?.message?.includes('connection') ||
                             error?.code === 'P1001' || // Prisma connection error code
                             error?.kind === 'Closed';
    
    if (!isConnectionError) {
      // Not a connection error, just rethrow
      throw error;
    }
    
    // Suppress "connection closed" errors from console - they will be handled silently
    // Only log if it's not a connection closed error or if reconnect fails
    const isConnectionClosedError = error?.message?.includes('Closed') || 
                                   error?.kind === 'Closed' ||
                                   error?.code === 'P1001';
    
    if (!isConnectionClosedError) {
      console.error('❌ Prisma connection check failed:', error?.message || error);
    }
    
    // Attempt to reconnect
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      // Only log reconnect attempts if not a connection closed error (to reduce noise)
      if (!isConnectionClosedError) {
        console.log(`🔄 Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
      }
      
      try {
        // Disconnect and reconnect
        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors - connection might already be closed
        }
        
        // Wait before reconnecting
        await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
        
        // Reconnect
        await prisma.$connect();
        
        // Test connection with query
        await prisma.$queryRaw`SELECT 1 as test`;
        
        isConnected = true;
        reconnectAttempts = 0;
        lastHealthCheck = Date.now();
        // Only log successful reconnect if it was a connection closed error
        if (isConnectionClosedError) {
          console.log('✅ Prisma reconnected successfully (connection was closed)');
        }
      } catch (reconnectError: any) {
        // Only log reconnect failures if not a connection closed error
        if (!isConnectionClosedError) {
          console.error(`❌ Reconnect attempt ${reconnectAttempts} failed:`, reconnectError?.message || reconnectError);
        }
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error('❌ Max reconnect attempts reached. Manual intervention required.');
          throw new Error('Database connection failed after maximum retry attempts');
        }
        
        // Don't throw - allow retry on next call
        isConnected = false;
      }
    } else {
      console.error('❌ Max reconnect attempts reached. Connection unavailable.');
      throw new Error('Database connection unavailable after maximum retry attempts');
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
      // Use lightweight query to keep connection alive
      await prisma.$queryRaw`SELECT 1 as heartbeat`;
      isConnected = true;
      lastHealthCheck = Date.now();
      // console.log('💓 Heartbeat: Connection alive');
    } catch (error: any) {
      // Check if it's a connection error
      const isConnectionError = error?.message?.includes('Closed') || 
                               error?.message?.includes('connection') ||
                               error?.code === 'P1001' ||
                               error?.kind === 'Closed';
      
      if (isConnectionError) {
        isConnected = false;
        console.error('💔 Heartbeat: Connection lost, attempting reconnect...');
        // Try to reconnect (non-blocking)
        ensurePrismaConnection().catch(err => {
          console.error('💔 Heartbeat: Reconnect failed', err?.message || err);
        });
      } else {
        // Other error, just log
        console.error('💔 Heartbeat: Query failed', error?.message || error);
      }
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

// Export helper to use in API routes with retry logic
export async function withPrisma<T>(
  callback: (prisma: PrismaClient) => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await ensurePrismaConnection();
      return await callback(prisma);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error
      const isConnectionError = error?.message?.includes('Closed') || 
                               error?.message?.includes('connection') ||
                               error?.code === 'P1001' ||
                               error?.kind === 'Closed';
      
      if (isConnectionError && attempt < retries) {
        console.log(`🔄 Retrying database operation (attempt ${attempt + 1}/${retries})...`);
        // Wait before retry with exponential backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Reset connection state to force reconnect
        isConnected = false;
        continue;
      }
      
      // Not a connection error or max retries reached
      throw error;
    }
  }
  
  throw lastError;
}