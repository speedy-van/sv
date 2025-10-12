import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get driver
    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Get payout settings
    const settings = await prisma.driverPayoutSettings.findUnique({
      where: { driverId: driver.id },
    });

    if (!settings) {
      return NextResponse.json({
        autoPayout: false,
        minPayoutAmountPence: 5000,
        verified: false,
        hasBankDetails: false,
        hasStripeAccount: false,
      });
    }

    return NextResponse.json({
      autoPayout: settings.autoPayout,
      minPayoutAmountPence: settings.minPayoutAmountPence,
      verified: settings.verified,
      verifiedAt: settings.verifiedAt,
      hasBankDetails: !!(
        settings.accountName &&
        settings.accountNumber &&
        settings.sortCode
      ),
      hasStripeAccount: !!settings.stripeAccountId,
      // Don't return sensitive bank details in GET request
    });
  } catch (error) {
    console.error('Error fetching payout settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      autoPayout,
      minPayoutAmountPence,
      accountName,
      accountNumber,
      sortCode,
    } = body;

    // Get driver
    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Validate inputs
    if (minPayoutAmountPence && minPayoutAmountPence < 1000) {
      return NextResponse.json(
        { error: 'Minimum payout amount must be at least £10' },
        { status: 400 }
      );
    }

    if (accountName && accountNumber && sortCode) {
      // Basic validation for UK bank details
      if (sortCode.length !== 6 || !/^\d{6}$/.test(sortCode)) {
        return NextResponse.json(
          { error: 'Invalid sort code format' },
          { status: 400 }
        );
      }

      if (accountNumber.length !== 8 || !/^\d{8}$/.test(accountNumber)) {
        return NextResponse.json(
          { error: 'Invalid account number format' },
          { status: 400 }
        );
      }
    }

    // Update or create payout settings
    const settings = await prisma.driverPayoutSettings.upsert({
      where: { driverId: driver.id },
      update: {
        autoPayout: autoPayout !== undefined ? autoPayout : undefined,
        minPayoutAmountPence: minPayoutAmountPence || undefined,
        accountName: accountName || undefined,
        accountNumber: accountNumber || undefined,
        sortCode: sortCode || undefined,
        verified: false, // Reset verification when details change
        verifiedAt: null,
      },
      create: {
        driverId: driver.id,
        autoPayout: autoPayout || false,
        minPayoutAmountPence: minPayoutAmountPence || 5000,
        accountName,
        accountNumber,
        sortCode,
        verified: false,
      },
    });

    return NextResponse.json({
      autoPayout: settings.autoPayout,
      minPayoutAmountPence: settings.minPayoutAmountPence,
      verified: settings.verified,
      hasBankDetails: !!(
        settings.accountName &&
        settings.accountNumber &&
        settings.sortCode
      ),
      hasStripeAccount: !!settings.stripeAccountId,
    });
  } catch (error) {
    console.error('Error updating payout settings:', error);
    return NextResponse.json(
      { error: 'Failed to update payout settings' },
      { status: 500 }
    );
  }
}
