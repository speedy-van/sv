import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  };

  // Check if any Mapbox token is available
  const hasAnyToken = Object.values(envVars).some(value => value === 'SET');

  return NextResponse.json({
    message: 'Mapbox Environment Variables Debug',
    environment: process.env.NODE_ENV,
    hasMapboxToken: hasAnyToken,
    environmentVariables: envVars,
    timestamp: new Date().toISOString(),
  });
}
