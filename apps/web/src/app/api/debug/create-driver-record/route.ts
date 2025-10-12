import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Check if user exists and is a driver
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { driver: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'driver') {
      return NextResponse.json({ error: 'User is not a driver' }, { status: 400 });
    }

    if (user.driver) {
      return NextResponse.json({ 
        message: 'Driver record already exists',
        driver: user.driver 
      });
    }

    // Create driver record
    const newDriver = await prisma.driver.create({
      data: {
        userId: userId,
        status: 'active',
        onboardingStatus: 'approved',
      },
    });

    // Create driver availability record - Default to online
    await prisma.driverAvailability.create({
      data: {
        driverId: newDriver.id,
        status: 'online',
        locationConsent: false,
      },
    });

    console.log('✅ Driver record created for user:', userId, 'driverId:', newDriver.id);

    return NextResponse.json({
      success: true,
      message: 'Driver record created successfully',
      driver: newDriver,
    });

  } catch (error) {
    console.error('❌ Error creating driver record:', error);
    return NextResponse.json(
      {
        error: 'Failed to create driver record',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
