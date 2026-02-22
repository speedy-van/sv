/**
 * Advanced Pricing Configuration API
 *
 * Manages detailed pricing configuration for driver earnings
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { requireAdmin } from '@/lib/auth';
import {
  coerceAdvancedPricingConfig,
  DEFAULT_ADVANCED_PRICING_CONFIG,
} from '@/lib/pricing/admin-settings-schema';

export const dynamic = 'force-dynamic';

function extractAdvancedConfigFromSettings(settings: {
  advancedConfig: unknown;
  baseFarePerJobPence: number;
  perDropFeePence: number;
  perMileFeePence: number;
  perMinuteFeePence: number;
  isActive: boolean;
}) {
  if (settings.advancedConfig && typeof settings.advancedConfig === 'object') {
    try {
      return coerceAdvancedPricingConfig(settings.advancedConfig);
    } catch (error) {
      logger.warn('Invalid stored advanced pricing config; falling back to derived defaults', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Derive a backward-compatible advanced config from canonical scalar columns.
  return coerceAdvancedPricingConfig({
    ...DEFAULT_ADVANCED_PRICING_CONFIG,
    baseFarePerRoutePence: settings.baseFarePerJobPence,
    perDropFeePence: settings.perDropFeePence,
    mileageRatePerMilePence: settings.perMileFeePence,
    drivingRatePerMinutePence: settings.perMinuteFeePence,
    isActive: settings.isActive,
  });
}

/**
 * GET /api/admin/settings/pricing/config
 * Get current pricing configuration
 */
export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Try to get from database (stored as JSON in PricingSettings metadata)
    const settings = await prisma.pricingSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        advancedConfig: true,
        baseFarePerJobPence: true,
        perDropFeePence: true,
        perMileFeePence: true,
        perMinuteFeePence: true,
        isActive: true,
      },
    });

    const config = settings
      ? extractAdvancedConfigFromSettings(settings)
      : coerceAdvancedPricingConfig(DEFAULT_ADVANCED_PRICING_CONFIG);

    return NextResponse.json({
      success: true,
      config,
      requestId,
    });
  } catch (error) {
    logger.error('Failed to get pricing config', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      {
        error: 'Failed to get pricing configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    );
  } finally {
    logger.info('Pricing config GET completed', {
      requestId,
      latencyMs: Date.now() - startedAt,
    });
  }
}

/**
 * POST /api/admin/settings/pricing/config
 * Save pricing configuration
 */
export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUser = authResult;
    const adminId = adminUser.id;

    const body = await request.json();
    let config;
    try {
      config = coerceAdvancedPricingConfig(body);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Invalid configuration';
      return NextResponse.json(
        {
          error: 'Invalid configuration',
          details,
          requestId,
        },
        { status: 400 }
      );
    }

    const newSettings = await prisma.$transaction(async (tx) => {
      await tx.pricingSettings.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      return tx.pricingSettings.create({
        data: {
          customerPriceAdjustment: 0,
          driverRateMultiplier: 1,
          baseFarePerJobPence: config.baseFarePerRoutePence,
          perDropFeePence: config.perDropFeePence,
          perMileFeePence: config.mileageRatePerMilePence,
          perMinuteFeePence: config.drivingRatePerMinutePence,
          isActive: config.isActive,
          createdBy: adminId,
          updatedBy: adminId,
          advancedConfig: {
            ...config,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    });

    // Log audit
    await logAudit({
      userId: adminId,
      action: 'update_pricing_config',
      entityType: 'pricing_settings',
      entityId: newSettings.id,
      details: {
        changes: config,
        requestId,
      },
    });

    logger.info('Pricing configuration updated', {
      adminId,
      settingsId: newSettings.id,
      requestId,
    });

    return NextResponse.json({
      success: true,
      config,
      message: 'Pricing configuration saved successfully',
      requestId,
    });
  } catch (error) {
    logger.error('Failed to save pricing config', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      {
        error: 'Failed to save pricing configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    );
  } finally {
    logger.info('Pricing config POST completed', {
      requestId,
      latencyMs: Date.now() - startedAt,
    });
  }
}

