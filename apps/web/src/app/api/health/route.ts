import { NextRequest, NextResponse } from 'next/server';
import { initializeCronJobs } from '@/lib/cron';

/**
 * Health Check Endpoint + Cron Initializer
 * 
 * This endpoint:
 * 1. Returns server health status
 * 2. Initializes cron jobs on first request (for platforms like Render)
 * 
 * Render automatically pings this endpoint to keep the server alive,
 * which ensures cron jobs are always running.
 */

let cronInitialized = false;

export async function GET(request: NextRequest) {
  // Initialize cron jobs on first health check
  if (!cronInitialized) {
    try {
      initializeCronJobs();
      cronInitialized = true;
      console.log('✅ Cron jobs initialized via health check');
    } catch (error) {
      console.error('❌ Failed to initialize cron jobs:', error);
    }
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cronJobsInitialized: cronInitialized,
    environment: process.env.NODE_ENV,
  });
}
