/**
 * Instrumentation Hook for Next.js
 * 
 * This file is automatically called when the server starts (if instrumentationHook is enabled).
 * Perfect for initializing cron jobs on Render/Railway/Heroku.
 * 
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side in production
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Server runtime detected - initializing cron jobs...');
    
    try {
      // Import and initialize cron jobs
      const { initializeCronJobs } = await import('./lib/cron');
      initializeCronJobs();
      
      console.log('✅ Cron jobs initialized successfully via instrumentation hook');
    } catch (error) {
      console.error('❌ Failed to initialize cron jobs:', error);
    }
  }
}
