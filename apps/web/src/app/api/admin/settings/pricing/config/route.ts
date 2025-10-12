/**
 * Advanced Pricing Configuration API
 * 
 * Manages detailed pricing configuration for driver earnings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Default pricing configuration
const DEFAULT_CONFIG = {
  baseFarePerRoutePence: 2500,
  perDropFeePence: 1200,
  mileageRatePerMilePence: 55,
  drivingRatePerMinutePence: 30,
  loadingRatePerMinutePence: 40,
  unloadingRatePerMinutePence: 40,
  waitingRatePerMinutePence: 25,
  performanceMultiplierMin: 0.8,
  performanceMultiplierMax: 1.5,
  performanceMultiplierDefault: 1.0,
  urgencyStandardMultiplier: 1.0,
  urgencyExpressMultiplier: 1.3,
  urgencyPremiumMultiplier: 1.6,
  routeExcellenceBonusPence: 500,
  weeklyPerformanceBonusPence: 2000,
  fuelEfficiencyBonusPence: 1000,
  backhaulBonusPence: 1500,
  monthlyAchievementBonusPence: 5000,
  quarterlyTierBonusPence: 15000,
  lateDeliveryPenaltyPence: 1000,
  routeDeviationPenaltyPence: 500,
  complianceBreachPenaltyPence: 2000,
  customerDamagePenaltyPence: 5000,
  helperSharePercentage: 30,
  platformFeeCapPercentage: 25,
  multiDropBonusEnabled: true,
  multiDropBonusThreshold: 5,
  multiDropBonusPerExtraDropPence: 300,
  longDistanceBonusEnabled: true,
  longDistanceBonusThresholdMiles: 50,
  longDistanceBonusPerExtraMilePence: 10,
  isActive: true,
};

/**
 * GET /api/admin/settings/pricing/config
 * Get current pricing configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get from database (stored as JSON in PricingSettings metadata)
    const settings = await prisma.pricingSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    let config = DEFAULT_CONFIG;

    if (settings && (settings as any).metadata) {
      try {
        const metadata = (settings as any).metadata;
        if (typeof metadata === 'object' && metadata.advancedConfig) {
          config = { ...DEFAULT_CONFIG, ...metadata.advancedConfig };
        }
      } catch (error) {
        logger.warn('Failed to parse pricing config metadata', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      config,
    });

  } catch (error) {
    logger.error('Failed to get pricing config', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to get pricing configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/pricing/config
 * Save pricing configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = (session.user as any).id;
    const config = await request.json();

    // Validate configuration
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid configuration',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Deactivate existing settings
    await prisma.pricingSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new settings with advanced config in metadata
    const newSettings = await prisma.pricingSettings.create({
      data: {
        customerPriceAdjustment: 0, // Keep for backward compatibility
        driverRateMultiplier: 1, // Keep for backward compatibility
        isActive: config.isActive !== false,
        createdBy: adminId,
        updatedBy: adminId,
        metadata: {
          advancedConfig: config,
          updatedAt: new Date().toISOString(),
        } as any,
      },
    });

    // Log audit
    await logAudit({
      userId: adminId,
      action: 'update_pricing_config',
      entityType: 'pricing_settings',
      entityId: newSettings.id,
      details: {
        changes: config,
      },
    });

    logger.info('Pricing configuration updated', {
      adminId,
      settingsId: newSettings.id,
    });

    return NextResponse.json({
      success: true,
      config,
      message: 'Pricing configuration saved successfully',
    });

  } catch (error) {
    logger.error('Failed to save pricing config', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to save pricing configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Validate pricing configuration
 */
function validateConfig(config: any): string[] {
  const errors: string[] = [];

  // Validate base rates
  if (config.baseFarePerRoutePence < 0 || config.baseFarePerRoutePence > 100000) {
    errors.push('Base fare must be between 0 and £1000');
  }

  if (config.perDropFeePence < 0 || config.perDropFeePence > 10000) {
    errors.push('Per drop fee must be between 0 and £100');
  }

  if (config.mileageRatePerMilePence < 0 || config.mileageRatePerMilePence > 1000) {
    errors.push('Mileage rate must be between 0 and £10 per mile');
  }

  // Validate multipliers
  if (
    config.performanceMultiplierMin < 0.1 ||
    config.performanceMultiplierMin > config.performanceMultiplierMax
  ) {
    errors.push('Invalid performance multiplier range');
  }

  if (config.performanceMultiplierMax < 0.1 || config.performanceMultiplierMax > 3) {
    errors.push('Performance multiplier max must be between 0.1 and 3');
  }

  // Validate percentages
  if (config.helperSharePercentage < 0 || config.helperSharePercentage > 50) {
    errors.push('Helper share must be between 0% and 50%');
  }

  if (config.platformFeeCapPercentage < 0 || config.platformFeeCapPercentage > 50) {
    errors.push('Platform fee cap must be between 0% and 50%');
  }

  return errors;
}

