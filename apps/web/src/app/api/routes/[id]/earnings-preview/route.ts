/**
 * ✅ FIX #11: Route Earnings Preview API
 * 
 * Allows drivers to see their estimated earnings before accepting a route.
 * This significantly improves acceptance rates by providing transparency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateRouteEarnings } from '@/lib/services/driver-earnings-service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routeId = params.id;
    
    logger.info(`📊 Calculating earnings preview for route ${routeId}`);
    
    // Calculate earnings
    const earnings = await calculateRouteEarnings(routeId);
    
    return NextResponse.json({
      success: true,
      data: {
        routeId,
        estimatedEarnings: earnings.totalEarnings,
        formattedEarnings: earnings.formattedEarnings,
        numberOfStops: earnings.numberOfStops,
        totalDistance: earnings.totalDistance,
        totalDuration: earnings.totalDuration,
        
        // Helpful metrics for driver decision-making
        earningsPerStop: earnings.earningsPerStop,
        earningsPerMile: earnings.earningsPerMile,
        earningsPerHour: earnings.earningsPerHour,
        
        // Formatted metrics
        formattedEarningsPerStop: `£${(earnings.earningsPerStop / 100).toFixed(2)}`,
        formattedEarningsPerMile: `£${(earnings.earningsPerMile / 100).toFixed(2)}`,
        formattedEarningsPerHour: `£${(earnings.earningsPerHour / 100).toFixed(2)}`,
        
        // Detailed breakdown (optional, for transparency)
        breakdown: earnings.breakdowns.map(b => ({
          baseFare: b.baseFare,
          perDropFee: b.perDropFee,
          mileageFee: b.mileageFee,
          timeFee: b.timeFee,
          bonuses: b.bonuses,
          netEarnings: b.cappedNetEarnings,
        })),
        
        // Recommendations
        recommendation: getRecommendation(earnings),
      },
    });
  } catch (error: any) {
    logger.error(`❌ Error calculating earnings preview: ${error.message}`);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to calculate earnings preview',
      },
      { status: 500 }
    );
  }
}

/**
 * Provide recommendation based on earnings metrics
 */
function getRecommendation(earnings: any): string {
  const earningsPerHour = earnings.earningsPerHour;
  
  // £40+/hour: Excellent
  if (earningsPerHour >= 4000) {
    return 'Excellent route! High earnings per hour. Strongly recommended.';
  }
  
  // £30-40/hour: Good
  if (earningsPerHour >= 3000) {
    return 'Good route with solid earnings. Recommended.';
  }
  
  // £20-30/hour: Fair
  if (earningsPerHour >= 2000) {
    return 'Fair route. Consider accepting if no better options available.';
  }
  
  // <£20/hour: Low
  return 'Low earnings per hour. Consider declining unless urgent.';
}

