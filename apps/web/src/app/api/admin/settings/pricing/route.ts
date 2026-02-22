import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { PricingSettingsInputSchema } from '@/lib/pricing/admin-settings-schema';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
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
        requestId,
      });
    }

    return NextResponse.json({
      id: settings.id,
      customerPriceAdjustment: Number(settings.customerPriceAdjustment),
      driverRateMultiplier: Number(settings.driverRateMultiplier),
      isActive: settings.isActive,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
      requestId,
    });
  } catch (error) {
    logger.error('Error fetching pricing settings', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  } finally {
    logger.info('Pricing settings GET completed', {
      requestId,
      latencyMs: Date.now() - startedAt,
    });
  }
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUser = authResult;

    const body = await request.json();
    const parsed = PricingSettingsInputSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid request payload';
      return NextResponse.json(
        {
          error: firstError,
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
          requestId,
        },
        { status: 400 }
      );
    }

    const {
      customerPriceAdjustment,
      driverRateMultiplier,
      isActive,
    } = parsed.data;

    const newSettings = await prisma.$transaction(async (tx) => {
      await tx.pricingSettings.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      return tx.pricingSettings.create({
        data: {
          customerPriceAdjustment,
          driverRateMultiplier,
          isActive,
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
      });
    });

    await logAudit({
      userId: adminUser.id,
      action: 'update_pricing_settings',
      entityType: 'pricing_settings',
      entityId: newSettings.id,
      details: {
        customerPriceAdjustment,
        driverRateMultiplier,
        isActive,
        requestId,
      },
    });

    return NextResponse.json({
      id: newSettings.id,
      customerPriceAdjustment: Number(newSettings.customerPriceAdjustment),
      driverRateMultiplier: Number(newSettings.driverRateMultiplier),
      isActive: newSettings.isActive,
      createdAt: newSettings.createdAt.toISOString(),
      updatedAt: newSettings.updatedAt.toISOString(),
      requestId,
    });
  } catch (error) {
    logger.error('Error saving pricing settings', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  } finally {
    logger.info('Pricing settings POST completed', {
      requestId,
      latencyMs: Date.now() - startedAt,
    });
  }
}
