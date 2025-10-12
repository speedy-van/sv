import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertDriver } from '@/lib/guards';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    assertDriver(session!);
    const formData = await request.json();
    const userId = session.user.id;

    // Get or create driver record
    let driver = await prisma.driver.findUnique({
      where: { userId },
      include: { vehicles: true, checks: true },
    });

    if (!driver) {
      // Create new driver record
      driver = await prisma.driver.create({
        data: {
          userId,
          onboardingStatus: 'docs_pending',
          basePostcode: formData.postcode,
          vehicleType: formData.vehicleType,
        },
        include: { vehicles: true, checks: true },
      });

      // Create driver availability record - Default to online
      await prisma.driverAvailability.create({
        data: {
          driverId: driver.id,
          status: 'online',
          locationConsent: false,
        },
      });
    }

    // Update user information
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: `${formData.firstName} ${formData.lastName}`,
      },
    });

    // Create or update vehicle
    if (driver.vehicles.length > 0) {
      await prisma.driverVehicle.update({
        where: { id: driver.vehicles[0].id },
        data: {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          reg: formData.vehicleReg,
          weightClass: formData.vehicleCapacity,
          motExpiry: formData.motExpiry ? new Date(formData.motExpiry) : null,
        },
      });
    } else {
      await prisma.driverVehicle.create({
        data: {
          driverId: driver.id,
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          reg: formData.vehicleReg,
          weightClass: formData.vehicleCapacity,
          motExpiry: formData.motExpiry ? new Date(formData.motExpiry) : null,
        },
      });
    }

    // Create or update driver checks
    if (driver.checks) {
      await prisma.driverChecks.update({
        where: { id: driver.checks.id },
        data: {
          // Add any additional check data here
        },
      });
    } else {
      await prisma.driverChecks.create({
        data: {
          driverId: driver.id,
          // Add any additional check data here
        },
      });
    }

    // Update driver status to docs_pending
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        onboardingStatus: 'docs_pending',
        basePostcode: formData.postcode,
        vehicleType: formData.vehicleType,
      },
    });

    // Log the onboarding submission
    await logAudit(session.user.id, 'driver_onboarding_submitted', driver.id, { targetType: 'driver', before: null, after: {
        onboardingStatus: 'docs_pending',
        vehicleType: formData.vehicleType,
        basePostcode: formData.postcode,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding submitted successfully',
      driver: {
        id: driver.id,
        onboardingStatus: 'docs_pending',
      },
    });
  } catch (error) {
    console.error('Driver onboarding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


