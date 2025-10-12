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
  startAutoRouteCreationCron();
  
  console.log('✅ All cron jobs initialized');
}

export { stopAssignmentExpiryCron } from './assignment-expiry';
export { stopAutoRouteCreationCron } from './auto-route-creation';

