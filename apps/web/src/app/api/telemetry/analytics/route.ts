import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { event, properties, userId, sessionId, timestamp, environment } =
      body;

    // Validate required fields
    if (!event || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use session user ID if available, otherwise use provided userId
    const actualUserId = session?.user?.id || userId;

    // Store telemetry event
    const telemetryEvent = await prisma.telemetryEvent.create({
      data: {
        event,
        properties: properties || {},
        userId: actualUserId,
        sessionId,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        environment: environment || process.env.NODE_ENV || 'development',
        userAgent: request.headers.get('user-agent') || '',
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Telemetry Event:', {
        event,
        userId: actualUserId,
        sessionId,
        properties,
        timestamp: new Date(timestamp).toISOString(),
      });
    }

    return NextResponse.json({ success: true, id: telemetryEvent.id });
  } catch (error) {
    console.error('Telemetry analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admin access
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    const where: any = {};

    if (event) {
      where.event = event;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    const events = await prisma.telemetryEvent.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Telemetry analytics query error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
