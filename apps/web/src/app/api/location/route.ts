import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(): Promise<NextResponse> {
  try {
    // Get client IP from headers (await required in Next.js 15+)
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // For localhost/development, return default data
    if (clientIp === 'unknown' || clientIp.includes('127.0.0.1') || clientIp.includes('::1')) {
      return NextResponse.json({
        city: null,
        region: null,
      });
    }

    // Fetch location data from ipapi.co (server-side)
    const response = await fetch(`https://ipapi.co/${clientIp}/json/`, {
      headers: {
        'User-Agent': 'speedy-van-app/1.0',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }

    const data = await response.json();

    return NextResponse.json({
      city: data.city || null,
      region: data.region || null,
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { city: null, region: null },
      { status: 200 }
    );
  }
}
