/**
 * Instrumentation Hook for Next.js
 * 
 * This file is automatically called when the server starts (if instrumentationHook is enabled).
 * Perfect for initializing cron jobs on Render/Railway/Heroku.
 * 
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Fix MaxListenersExceededWarning by increasing the limit
  // Multiple modules (Prisma, Redis, Queue, etc.) add SIGINT/SIGTERM listeners
  // Default limit is 10, we need more for graceful shutdown handlers
  if (typeof process !== 'undefined' && process.setMaxListeners) {
    process.setMaxListeners(20);
  }

  // Only run on server-side in production
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Server runtime detected - initializing cron jobs...');
    
    try {
      // Wait a bit for Prisma Client to be fully initialized
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify Prisma is available before initializing cron jobs
      const { prisma } = await import('./lib/prisma');
      if (!prisma) {
        console.error('❌ Prisma Client not available, skipping cron jobs');
        return;
      }
      
      // Import and initialize cron jobs
      const { initializeCronJobs } = await import('./lib/cron');
      initializeCronJobs();
      
      console.log('✅ Cron jobs initialized successfully via instrumentation hook');
    } catch (error) {
      console.error('❌ Failed to initialize cron jobs:', error);
    }
  }
}
