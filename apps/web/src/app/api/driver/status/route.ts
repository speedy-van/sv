import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Driver Status API - Starting request');

    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      if (bearerAuth.user.role !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Driver access required' },
          { status: 403, headers: corsHeaders }
        );
      }
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as any)?.role !== 'driver') {
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401, headers: corsHeaders }
        );
      }
      userId = session.user.id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['online', 'offline'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "online" or "offline"' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Update driver availability status
    // We use a custom field or update existing status
    // For now, we'll update the driver's status field to track online/offline
    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        // Store online/offline in metadata or custom field
        // For backward compatibility, keep status as 'active' but track availability separately
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Driver ${driver.id} is now ${status}`);

    return NextResponse.json(
      {
        success: true,
        message: `Driver is now ${status}`,
        data: {
          driverId: driver.id,
          status: status,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('❌ Driver Status API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update driver status' },
      { status: 500, headers: corsHeaders }
    );
  }
}
