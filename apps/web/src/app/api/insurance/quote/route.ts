import { NextRequest, NextResponse } from 'next/server';
import type { SpecializedItemCategory, InsuranceTier } from '@prisma/client';

/**
 * POST /api/insurance/quote
 * Calculate insurance quote for specialized items
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      category,
      declaredValue,
      tier,
      additionalInfo = {}
    } = body;

    // Validate required fields
    if (!category || !declaredValue || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: category, declaredValue, tier' },
        { status: 400 }
      );
    }

    // Calculate base premium (percentage of declared value)
    const basePremium = calculateBasePremium(declaredValue, tier);

    // Calculate risk modifier based on various factors
    let riskModifier = 1.0;

    // Category risk factors
    const categoryRiskMap: Record<string, number> = {
      PIANO_UPRIGHT: 1.2,
      PIANO_GRAND: 1.5,
      FINE_ART_PAINTING: 1.4,
      FINE_ART_SCULPTURE: 1.3,
      MEDICAL_EQUIPMENT: 1.3,
      ANTIQUE_FURNITURE: 1.35,
      LUXURY_FURNITURE: 1.25,
      FRAGILE_ELECTRONICS: 1.3,
      CUSTOM_SPECIALIZED: 1.4
    };

    riskModifier *= categoryRiskMap[category] || 1.0;

    // Stairs increase risk
    if (additionalInfo.stairsRequired) {
      riskModifier *= 1.15;
    }

    // Complexity score impact
    if (additionalInfo.complexityScore && additionalInfo.complexityScore > 7) {
      riskModifier *= 1.25;
    }

    // Age of item (antiques are higher risk)
    if (additionalInfo.age === 'Victorian (1837-1901)') {
      riskModifier *= 1.2;
    }

    // Equipment-based discounts (reduces risk)
    if (additionalInfo.useSpecializedEquipment) {
      riskModifier *= 0.85; // 15% discount
    }

    // Photo documentation discount
    if (additionalInfo.includePhotoDocumentation) {
      riskModifier *= 0.90; // 10% discount
    }

    // Climate control discount
    if (additionalInfo.climateControlled) {
      riskModifier *= 0.95; // 5% discount
    }

    // On-site visit reduces risk
    if (additionalInfo.onSiteVisitCompleted) {
      riskModifier *= 0.92; // 8% discount
    }

    // Calculate final premium
    const finalPremium = Math.round(basePremium * riskModifier);

    // Get coverage amount
    const coverageAmount = getCoverageAmount(tier);

    // Calculate breakdown
    const breakdown = {
      declaredValue: declaredValue / 100, // Convert to pounds
      basePremium: basePremium / 100,
      categoryRisk: Math.round(((categoryRiskMap[category] || 1.0) - 1) * 100),
      riskAdjustment: Math.round((riskModifier - 1) * 100),
      finalPremium: finalPremium / 100
    };

    // List applied discounts
    const discountsApplied = {
      specializedEquipment: additionalInfo.useSpecializedEquipment,
      photoDocumentation: additionalInfo.includePhotoDocumentation,
      climateControl: additionalInfo.climateControlled,
      onSiteVisit: additionalInfo.onSiteVisitCompleted
    };

    return NextResponse.json({
      success: true,
      premium: finalPremium,
      premiumGBP: finalPremium / 100,
      coverage: coverageAmount,
      coverageGBP: coverageAmount / 100,
      tier,
      breakdown,
      discountsApplied,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });
  } catch (error: any) {
    console.error('Error calculating insurance quote:', error);
    return NextResponse.json(
      { error: 'Failed to calculate insurance quote', details: error.message },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateBasePremium(declaredValue: number, tier: InsuranceTier): number {
  const tierRates: Record<InsuranceTier, number> = {
    STANDARD: 0.025,   // 2.5%
    PREMIUM: 0.035,    // 3.5%
    PLATINUM: 0.045,   // 4.5%
    BESPOKE: 0.055     // 5.5%
  };

  const rate = tierRates[tier] || 0.025;
  return Math.round(declaredValue * rate);
}

function getCoverageAmount(tier: InsuranceTier): number {
  const tierCoverage: Record<InsuranceTier, number> = {
    STANDARD: 500000,      // £5,000 in pence
    PREMIUM: 2500000,      // £25,000
    PLATINUM: 10000000,    // £100,000
    BESPOKE: 100000000     // £1,000,000 (flexible)
  };

  return tierCoverage[tier] || 500000;
}
