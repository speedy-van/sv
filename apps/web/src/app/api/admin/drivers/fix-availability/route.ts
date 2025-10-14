import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/admin/drivers/fix-availability - Fix missing availability records
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🔧 Starting availability records fix...');

    // Find all drivers without availability records
    const driversWithoutAvailability = await prisma.driver.findMany({
      where: {
        status: 'active',
        onboardingStatus: 'approved',
        DriverAvailability: null, // No availability record
      },
      select: {
        id: true,
        User: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    console.log(`📋 Found ${driversWithoutAvailability.length} drivers without availability records`);

    if (driversWithoutAvailability.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All drivers already have availability records',
        driversProcessed: 0,
        driversFixed: 0,
      });
    }

    // Create availability records for drivers without them
    const createdRecords = [];
    
    for (const driver of driversWithoutAvailability) {
      try {
        await prisma.driverAvailability.create({
          data: {
            driverId: driver.id,
            status: 'online', // Default to online so they appear in available lists
            locationConsent: true, // Set to true so they appear in assignment lists
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        createdRecords.push({
          driverId: driver.id,
          driverName: driver.User.name,
          driverEmail: driver.User.email,
          status: 'created'
        });

        console.log(`✅ Created availability record for driver ${driver.User.name} (${driver.id})`);
      } catch (error) {
        console.error(`❌ Failed to create availability for driver ${driver.id}:`, error);
        createdRecords.push({
          driverId: driver.id,
          driverName: driver.User.name,
          driverEmail: driver.User.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = createdRecords.filter(r => r.status === 'created').length;
    const failCount = createdRecords.filter(r => r.status === 'failed').length;

    console.log(`🎯 Availability fix completed: ${successCount} created, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Fixed availability records for ${successCount} drivers`,
      driversProcessed: driversWithoutAvailability.length,
      driversFixed: successCount,
      driversFailed: failCount,
      results: createdRecords,
      summary: {
        totalDriversFound: driversWithoutAvailability.length,
        recordsCreated: successCount,
        recordsFailed: failCount,
      }
    });

  } catch (error) {
    console.error('❌ Error fixing driver availability:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix driver availability records',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/drivers/fix-availability - Check which drivers need availability fixes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Count drivers by availability status
    const [
      totalActiveDrivers,
      driversWithAvailability,
      driversWithoutAvailability,
      driversWithLocationConsent
    ] = await Promise.all([
      prisma.driver.count({
        where: {
          status: 'active',
          onboardingStatus: 'approved',
        }
      }),
      prisma.driver.count({
        where: {
          status: 'active',
          onboardingStatus: 'approved',
          DriverAvailability: {
            isNot: null
          }
        }
      }),
      prisma.driver.findMany({
        where: {
          status: 'active',
          onboardingStatus: 'approved',
          DriverAvailability: null
        },
        select: {
          id: true,
          User: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      }),
      prisma.driver.count({
        where: {
          status: 'active',
          onboardingStatus: 'approved',
          DriverAvailability: {
            locationConsent: true
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      summary: {
        totalActiveDrivers,
        driversWithAvailability,
        driversWithoutAvailability: driversWithoutAvailability.length,
        driversWithLocationConsent,
        needsFixing: driversWithoutAvailability.length > 0
      },
      driversNeedingFix: driversWithoutAvailability.map(driver => ({
        id: driver.id,
        name: driver.User.name,
        email: driver.User.email
      })),
      recommendations: driversWithoutAvailability.length > 0 
        ? ['Run POST /api/admin/drivers/fix-availability to create missing records']
        : ['All drivers have availability records']
    });

  } catch (error) {
    console.error('❌ Error checking driver availability:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check driver availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}