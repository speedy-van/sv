import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Update driver with sample data
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        basePostcode: 'G1 1AA',
        vehicleType: 'large_van',
        rating: 4.8,
        strikes: 0,
        status: 'active',
      },
    });

    // Update user last login
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
      },
    });

    // Update driver application if exists
    try {
      await prisma.driverApplication.updateMany({
        where: { userId: userId },
        data: {
          firstName: 'John',
          lastName: 'Driver',
          phone: '07901846297',
        },
      });
    } catch (error) {
      console.log('Warning: Could not update driver application:', error);
    }

    console.log('✅ Sample profile data created for driver:', driver.id);

    return NextResponse.json({
      success: true,
      message: 'Sample profile data created successfully',
      data: {
        profileUpdated: true,
        userUpdated: true,
        applicationUpdated: true,
      },
    });

  } catch (error) {
    console.error('❌ Error creating sample profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to create sample profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}