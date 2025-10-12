import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface VisitorTrackingData {
  sessionId: string;
  visitorId?: string;
  page: string;
  referrer?: string;
  userAgent: string;
  ipAddress: string;
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType?: string;
  screenResolution?: string;
  language?: string;
  timezone?: string;
  action?: string;
  actionData?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: VisitorTrackingData = await request.json();

    // Get IP address from various possible headers
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      body.ipAddress ||
      'unknown';

    // Get geolocation data from Cloudflare headers (if available)
    const cfCountry = request.headers.get('cf-ipcountry');
    const cfCity = request.headers.get('cf-ipcity');
    const cfRegion = request.headers.get('cf-region');
    const cfLatitude = request.headers.get('cf-latitude');
    const cfLongitude = request.headers.get('cf-longitude');

    // Parse user agent for device info
    const userAgent = body.userAgent || request.headers.get('user-agent') || 'unknown';
    const deviceInfo = parseUserAgent(userAgent);

    // Get geolocation from IP if not provided
    let locationData = {
      country: body.country || cfCountry || null,
      city: body.city || cfCity || null,
      region: body.region || cfRegion || null,
      latitude: body.latitude || (cfLatitude ? parseFloat(cfLatitude) : null),
      longitude: body.longitude || (cfLongitude ? parseFloat(cfLongitude) : null),
    };

    // If no location data, try to get from IP using a geolocation service
    if (!locationData.country && ipAddress !== 'unknown') {
      try {
        const geoData = await getLocationFromIP(ipAddress);
        locationData = { ...locationData, ...geoData };
      } catch (error) {
        console.warn('Failed to get location from IP:', error);
      }
    }

    // Create or update visitor session
    const visitorSession = await prisma.visitorSession.upsert({
      where: { sessionId: body.sessionId },
      create: {
        id: `session-${body.sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`,
        sessionId: body.sessionId,
        visitorId: body.visitorId,
        ipAddress,
        country: locationData.country,
        city: locationData.city,
        region: locationData.region,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        userAgent,
        browserName: deviceInfo.browserName,
        browserVersion: deviceInfo.browserVersion,
        osName: deviceInfo.osName,
        osVersion: deviceInfo.osVersion,
        deviceType: deviceInfo.deviceType,
        screenResolution: body.screenResolution,
        language: body.language,
        timezone: body.timezone,
        entryPage: body.page,
        entryTime: new Date(),
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Track page view
    await prisma.pageView.create({
      data: {
        id: `pageview-${body.sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`,
        sessionId: body.sessionId,
        page: body.page,
        referrer: body.referrer,
        timestamp: new Date(),
      },
    });

    // Track action if provided
    if (body.action) {
      await prisma.visitorAction.create({
        data: {
          id: `action-${body.sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`,
          sessionId: body.sessionId,
          action: body.action,
          actionData: body.actionData || {},
          timestamp: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: body.sessionId,
      location: locationData,
    });
  } catch (error) {
    console.error('Visitor tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Parse user agent to extract device information
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();

  // Detect browser
  let browserName = 'Unknown';
  let browserVersion = '';

  if (ua.includes('firefox')) {
    browserName = 'Firefox';
    const match = ua.match(/firefox\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('edg')) {
    browserName = 'Edge';
    const match = ua.match(/edg\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('chrome')) {
    browserName = 'Chrome';
    const match = ua.match(/chrome\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('safari')) {
    browserName = 'Safari';
    const match = ua.match(/version\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : '';
  }

  // Detect OS
  let osName = 'Unknown';
  let osVersion = '';

  if (ua.includes('windows nt 10')) {
    osName = 'Windows';
    osVersion = '10/11';
  } else if (ua.includes('windows nt')) {
    osName = 'Windows';
    const match = ua.match(/windows nt (\d+\.\d+)/);
    osVersion = match ? match[1] : '';
  } else if (ua.includes('mac os x')) {
    osName = 'macOS';
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  } else if (ua.includes('android')) {
    osName = 'Android';
    const match = ua.match(/android (\d+\.\d+)/);
    osVersion = match ? match[1] : '';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    osName = 'iOS';
    const match = ua.match(/os (\d+[._]\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  } else if (ua.includes('linux')) {
    osName = 'Linux';
  }

  // Detect device type
  let deviceType = 'Desktop';
  if (ua.includes('mobile')) {
    deviceType = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'Tablet';
  }

  return {
    browserName,
    browserVersion,
    osName,
    osVersion,
    deviceType,
  };
}

// Get location from IP address (using ipapi.co - free tier)
async function getLocationFromIP(ipAddress: string) {
  try {
    // Skip for local/private IPs
    if (
      ipAddress === 'unknown' ||
      ipAddress.startsWith('127.') ||
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress === '::1'
    ) {
      return {
        country: 'Local',
        city: 'Local',
        region: 'Local',
        latitude: null,
        longitude: null,
      };
    }

    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Geolocation API failed');
    }

    const data = await response.json();

    return {
      country: data.country_name || null,
      city: data.city || null,
      region: data.region || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };
  } catch (error) {
    console.error('IP geolocation error:', error);
    return {
      country: null,
      city: null,
      region: null,
      latitude: null,
      longitude: null,
    };
  }
}

// GET endpoint to retrieve visitor analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const sessions = await prisma.visitorSession.findMany({
      take: limit,
      skip: skip,
      orderBy: { entryTime: 'desc' },
      include: {
        PageView: true,
        VisitorAction: true,
      },
    });

    const total = await prisma.visitorSession.count();

    return NextResponse.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Get visitors error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
