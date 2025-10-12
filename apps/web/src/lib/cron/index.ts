/**
 * Cron Jobs Initializer
 * 
 * Starts all cron jobs when the server starts.
 * This works on any platform (Render, Railway, Heroku, etc.)
 */

import { startAssignmentExpiryCron } from './assignment-expiry';

/**
 * Initialize all cron jobs
 * Call this once when the server starts
 */
export function initializeCronJobs() {
  console.log('🚀 Initializing cron jobs...');
  
  // Start assignment expiry cron (runs every minute)
  startAssignmentExpiryCron();
  
  console.log('✅ All cron jobs initialized');
}

export { stopAssignmentExpiryCron } from './assignment-expiry';

