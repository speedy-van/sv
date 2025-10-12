import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the most recent active pricing settings
    const settings = await prisma.pricingSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        id: 'default',
        customerPriceAdjustment: 0,
        driverRateMultiplier: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      id: settings.id,
      customerPriceAdjustment: Number(settings.customerPriceAdjustment),
      driverRateMultiplier: Number(settings.driverRateMultiplier),
      isActive: settings.isActive,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching pricing settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerPriceAdjustment, driverRateMultiplier, isActive } = body;

    // Validate inputs
    if (
      typeof customerPriceAdjustment !== 'number' ||
      customerPriceAdjustment < -1 ||
      customerPriceAdjustment > 1
    ) {
      return NextResponse.json(
        { error: 'Customer price adjustment must be between -1 and 1' },
        { status: 400 }
      );
    }

    if (
      typeof driverRateMultiplier !== 'number' ||
      driverRateMultiplier < 0.5 ||
      driverRateMultiplier > 2
    ) {
      return NextResponse.json(
        { error: 'Driver rate multiplier must be between 0.5 and 2' },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    // Deactivate all existing settings
    await prisma.pricingSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new settings
    const newSettings = await prisma.pricingSettings.create({
      data: {
        customerPriceAdjustment,
        driverRateMultiplier,
        isActive,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      id: newSettings.id,
      customerPriceAdjustment: Number(newSettings.customerPriceAdjustment),
      driverRateMultiplier: Number(newSettings.driverRateMultiplier),
      isActive: newSettings.isActive,
      createdAt: newSettings.createdAt.toISOString(),
      updatedAt: newSettings.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error saving pricing settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
