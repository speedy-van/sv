import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasMapboxToken: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      tokenLength: process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.length || 0,
    },
  });
}
