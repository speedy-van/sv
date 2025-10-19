/**
 * Route Analytics API
 * 
 * Provides comprehensive analytics and insights for a specific route:
 * - Performance metrics
 * - Cost analysis
 * - Efficiency scores
 * - Comparison with similar routes
 * - Optimization suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/routes/[id]/analytics
 * Get comprehensive analytics for a route
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: routeId } = await params;

    // Get route with all related data
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        drops: {
          include: {
            Booking: {
              select: {
                id: true,
                reference: true,
                totalGBP: true,
              },
            },
          },
          orderBy: { timeWindowStart: 'asc' },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(route);

    // Calculate cost analysis
    const costAnalysis = calculateCostAnalysis(route);

    // Calculate efficiency scores
    const efficiencyScores = calculateEfficiencyScores(route);

    // Get comparison with similar routes
    const comparison = await getRouteComparison(route);

    // Generate optimization suggestions
    const suggestions = generateOptimizationSuggestions(route, performanceMetrics, efficiencyScores);

    // Calculate timeline
    const timeline = calculateTimeline(route);

    // Calculate drop statistics
    const dropStats = calculateDropStatistics(route);

    logger.info('Route analytics retrieved', {
      routeId,
      adminId: (session.user as any).id,
    });

    return NextResponse.json({
      success: true,
      data: {
        route: {
          id: route.id,
          reference: route.reference,
          status: route.status,
          startTime: route.startTime,
          endTime: route.endTime,
          totalDrops: route.totalDrops,
          completedDrops: route.completedDrops,
        },
        performanceMetrics,
        costAnalysis,
        efficiencyScores,
        comparison,
        suggestions,
        timeline,
        dropStats,
      },
    });

  } catch (error) {
    logger.error('Failed to get route analytics', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to get route analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Analytics Calculation Functions

function calculatePerformanceMetrics(route: any) {
  const completionRate = route.totalDrops > 0 
    ? (route.completedDrops / route.totalDrops) * 100 
    : 0;

  const onTimeDeliveries = route.drops.filter((drop: any) => {
    if (!drop.completedAt || !drop.timeWindowEnd) return false;
    return new Date(drop.completedAt) <= new Date(drop.timeWindowEnd);
  }).length;

  const onTimeRate = route.completedDrops > 0
    ? (onTimeDeliveries / route.completedDrops) * 100
    : 0;

  const averageDelay = route.drops
    .filter((drop: any) => drop.completedAt && drop.timeWindowEnd)
    .reduce((sum: number, drop: any) => {
      const delay = Math.max(0, 
        (new Date(drop.completedAt).getTime() - new Date(drop.timeWindowEnd).getTime()) / 60000
      );
      return sum + delay;
    }, 0) / (route.completedDrops || 1);

  const estimatedDuration = route.estimatedDuration || 0;
  const actualDuration = route.actualDuration || 
    (route.endTime && route.startTime 
      ? (new Date(route.endTime).getTime() - new Date(route.startTime).getTime()) / 60000
      : 0);

  const durationVariance = estimatedDuration > 0
    ? ((actualDuration - estimatedDuration) / estimatedDuration) * 100
    : 0;

  return {
    completionRate: Math.round(completionRate * 100) / 100,
    onTimeRate: Math.round(onTimeRate * 100) / 100,
    averageDelay: Math.round(averageDelay * 100) / 100,
    estimatedDuration,
    actualDuration: Math.round(actualDuration),
    durationVariance: Math.round(durationVariance * 100) / 100,
    totalDrops: route.totalDrops,
    completedDrops: route.completedDrops,
    failedDrops: route.drops.filter((d: any) => d.status === 'failed').length,
  };
}

function calculateCostAnalysis(route: any) {
  const totalRevenue = route.drops.reduce(
    (sum: number, drop: any) => sum + (Number(drop.quotedPrice) || 0),
    0
  );

  const fuelCost = Number(route.fuelCost) || 0;
  const tollCost = Number(route.tollCost) || 0;
  const driverPayout = Number(route.driverPayout) || 0;
  const bonuses = Number(route.bonusesTotal) || 0;
  const penalties = Number(route.penaltiesTotal) || 0;

  const totalCosts = fuelCost + tollCost + driverPayout + bonuses;
  const netProfit = totalRevenue - totalCosts + penalties;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const costPerDrop = route.totalDrops > 0 ? totalCosts / route.totalDrops : 0;
  const revenuePerDrop = route.totalDrops > 0 ? totalRevenue / route.totalDrops : 0;

  const distanceKm = route.optimizedDistanceKm || route.actualDistanceKm || 0;
  const costPerKm = distanceKm > 0 ? totalCosts / distanceKm : 0;

  return {
    totalRevenue: Math.round(totalRevenue) / 100,
    totalCosts: Math.round(totalCosts) / 100,
    netProfit: Math.round(netProfit) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    breakdown: {
      fuelCost: Math.round(fuelCost) / 100,
      tollCost: Math.round(tollCost) / 100,
      driverPayout: Math.round(driverPayout) / 100,
      bonuses: Math.round(bonuses) / 100,
      penalties: Math.round(penalties) / 100,
    },
    perDrop: {
      cost: Math.round(costPerDrop) / 100,
      revenue: Math.round(revenuePerDrop) / 100,
    },
    costPerKm: Math.round(costPerKm * 100) / 100,
  };
}

function calculateEfficiencyScores(route: any) {
  // Distance efficiency
  const estimatedDistance = route.optimizedDistanceKm || 0;
  const actualDistance = route.actualDistanceKm || estimatedDistance;
  const distanceEfficiency = estimatedDistance > 0
    ? Math.min(100, (estimatedDistance / actualDistance) * 100)
    : 0;

  // Time efficiency
  const estimatedTime = route.estimatedDuration || 0;
  const actualTime = route.actualDuration || 
    (route.endTime && route.startTime 
      ? (new Date(route.endTime).getTime() - new Date(route.startTime).getTime()) / 60000
      : 0);
  const timeEfficiency = estimatedTime > 0 && actualTime > 0
    ? Math.min(100, (estimatedTime / actualTime) * 100)
    : 0;

  // Drop density (drops per km)
  const dropDensity = actualDistance > 0 ? route.totalDrops / actualDistance : 0;

  // Optimization score
  const optimizationScore = route.optimizationScore 
    ? route.optimizationScore * 100 
    : 0;

  // Overall efficiency (weighted average)
  const overallEfficiency = (
    distanceEfficiency * 0.3 +
    timeEfficiency * 0.3 +
    (route.completedDrops / route.totalDrops) * 100 * 0.4
  );

  return {
    overall: Math.round(overallEfficiency * 100) / 100,
    distance: Math.round(distanceEfficiency * 100) / 100,
    time: Math.round(timeEfficiency * 100) / 100,
    dropDensity: Math.round(dropDensity * 100) / 100,
    optimization: Math.round(optimizationScore * 100) / 100,
    rating: getEfficiencyRating(overallEfficiency),
  };
}

function getEfficiencyRating(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 40) return 'Below Average';
  return 'Poor';
}

async function getRouteComparison(route: any) {
  // Get similar routes (same service tier, similar drop count, completed in last 30 days)
  const similarRoutes = await prisma.route.findMany({
    where: {
      serviceTier: route.serviceTier,
      totalDrops: {
        gte: route.totalDrops - 2,
        lte: route.totalDrops + 2,
      },
      status: 'completed',
      startTime: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      id: { not: route.id },
    },
    take: 10,
  });

  if (similarRoutes.length === 0) {
    return {
      available: false,
      message: 'No similar routes found for comparison',
    };
  }

  const avgCompletionRate = similarRoutes.reduce(
    (sum, r) => sum + (r.completedDrops / r.totalDrops) * 100,
    0
  ) / similarRoutes.length;

  const avgDuration = similarRoutes.reduce(
    (sum, r) => sum + (r.actualDuration || 0),
    0
  ) / similarRoutes.length;

  const avgDistance = similarRoutes.reduce(
    (sum, r) => sum + (r.actualDistanceKm || 0),
    0
  ) / similarRoutes.length;

  const currentCompletionRate = (route.completedDrops / route.totalDrops) * 100;
  const currentDuration = route.actualDuration || 0;
  const currentDistance = route.actualDistanceKm || 0;

  return {
    available: true,
    similarRoutesCount: similarRoutes.length,
    averages: {
      completionRate: Math.round(avgCompletionRate * 100) / 100,
      duration: Math.round(avgDuration),
      distance: Math.round(avgDistance * 100) / 100,
    },
    current: {
      completionRate: Math.round(currentCompletionRate * 100) / 100,
      duration: currentDuration,
      distance: currentDistance,
    },
    comparison: {
      completionRate: Math.round((currentCompletionRate - avgCompletionRate) * 100) / 100,
      duration: Math.round(currentDuration - avgDuration),
      distance: Math.round((currentDistance - avgDistance) * 100) / 100,
    },
  };
}

function generateOptimizationSuggestions(route: any, metrics: any, efficiency: any) {
  const suggestions: Array<{ type: string; priority: string; message: string; impact: string }> = [];

  // Completion rate suggestions
  if (metrics.completionRate < 90) {
    suggestions.push({
      type: 'completion',
      priority: 'high',
      message: 'Completion rate is below target. Consider reviewing drop assignments and driver capacity.',
      impact: 'Improve completion rate by 10-15%',
    });
  }

  // On-time delivery suggestions
  if (metrics.onTimeRate < 85) {
    suggestions.push({
      type: 'timing',
      priority: 'high',
      message: 'On-time delivery rate is low. Review time windows and route optimization.',
      impact: 'Reduce average delay by 20-30%',
    });
  }

  // Distance efficiency suggestions
  if (efficiency.distance < 80) {
    suggestions.push({
      type: 'distance',
      priority: 'medium',
      message: 'Route distance is higher than optimal. Consider reordering drops for better efficiency.',
      impact: 'Reduce distance by 10-15%',
    });
  }

  // Drop density suggestions
  if (efficiency.dropDensity < 0.5) {
    suggestions.push({
      type: 'density',
      priority: 'medium',
      message: 'Drop density is low. Consider adding more drops to this route or splitting into smaller routes.',
      impact: 'Improve cost efficiency by 15-20%',
    });
  }

  // Duration variance suggestions
  if (Math.abs(metrics.durationVariance) > 20) {
    suggestions.push({
      type: 'duration',
      priority: 'low',
      message: 'Actual duration varies significantly from estimate. Review time estimates and traffic patterns.',
      impact: 'Improve scheduling accuracy by 15-20%',
    });
  }

  return suggestions;
}

function calculateTimeline(route: any) {
  const events: Array<{ time: Date; event: string; status: string }> = [];

  events.push({
    time: route.createdAt,
    event: 'Route Created',
    status: 'info',
  });

  if (route.acceptedAt) {
    events.push({
      time: route.acceptedAt,
      event: 'Driver Accepted',
      status: 'success',
    });
  }

  events.push({
    time: route.startTime,
    event: 'Scheduled Start',
    status: 'info',
  });

  // Add drop events
  route.drops.forEach((drop: any) => {
    if (drop.completedAt) {
      events.push({
        time: drop.completedAt,
        event: `Drop Completed: ${drop.deliveryAddress}`,
        status: drop.status === 'delivered' ? 'success' : 'error',
      });
    }
  });

  if (route.endTime) {
    events.push({
      time: route.endTime,
      event: 'Route Completed',
      status: 'success',
    });
  }

  return events.sort((a, b) => a.time.getTime() - b.time.getTime());
}

function calculateDropStatistics(route: any) {
  const drops = route.drops;

  const statusCounts = {
    pending: 0,
    assigned_to_route: 0,
    picked_up: 0,
    in_transit: 0,
    delivered: 0,
    failed: 0,
  };

  drops.forEach((drop: any) => {
    if (statusCounts.hasOwnProperty(drop.status)) {
      statusCounts[drop.status as keyof typeof statusCounts]++;
    }
  });

  const totalValue = drops.reduce(
    (sum: number, drop: any) => sum + (Number(drop.quotedPrice) || 0),
    0
  );

  const averageValue = drops.length > 0 ? totalValue / drops.length : 0;

  const totalWeight = drops.reduce(
    (sum: number, drop: any) => sum + (drop.weight || 0),
    0
  );

  const totalVolume = drops.reduce(
    (sum: number, drop: any) => sum + (drop.volume || 0),
    0
  );

  return {
    total: drops.length,
    byStatus: statusCounts,
    totalValue: Math.round(totalValue) / 100,
    averageValue: Math.round(averageValue) / 100,
    totalWeight: Math.round(totalWeight * 100) / 100,
    totalVolume: Math.round(totalVolume * 100) / 100,
  };
}

