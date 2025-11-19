import { NextResponse } from 'next/server';

/**
 * CRITICAL: Health check endpoint for Render deployment
 * Must respond within 5 seconds or deployment fails
 * Kept minimal for fastest response time
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: Math.floor(process.uptime()),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    }
  );
}

// CRITICAL: Force dynamic to prevent static optimization
// Health checks must be real-time, not pre-rendered
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';