/**
 * Cron Jobs Initializer
 * 
 * Starts all cron jobs when the server starts.
 * This works on any platform (Render, Railway, Heroku, etc.)
 */

import { startAssignmentExpiryCron } from './assignment-expiry';
import { startAutoRouteCreationCron } from './auto-route-creation';

/**
 * Initialize all cron jobs
 * Call this once when the server starts
 */
export function initializeCronJobs() {
  console.log('🚀 Initializing cron jobs...');
  
  // Start assignment expiry cron (runs every minute)
  startAssignmentExpiryCron();
  
  // Start auto route creation cron (runs every hour)
  // DISABLED: Routes should be created manually by admin via Smart Route Generator
  // Enable this only if you want automatic route creation from pending bookings
  const AUTO_ROUTE_CREATION_ENABLED = process.env.AUTO_ROUTE_CREATION_ENABLED === 'true';
  
  if (AUTO_ROUTE_CREATION_ENABLED) {
    console.log('✅ Auto route creation is ENABLED');
    startAutoRouteCreationCron();
  } else {
    console.log('⚠️ Auto route creation is DISABLED - Admin must create routes manually');
  }
  
  console.log('✅ All cron jobs initialized');
}

export { stopAssignmentExpiryCron } from './assignment-expiry';
export { stopAutoRouteCreationCron } from './auto-route-creation';

