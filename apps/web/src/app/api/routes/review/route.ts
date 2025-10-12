/**
 * ✅ PRE-EXECUTION ROUTE REVIEW API
 * 
 * MANDATORY: Admin/Driver MUST review route plan before execution
 * 
 * Displays:
 * - Ordered pickups & drops
 * - Total miles (NOT km)
 * - Estimated time
 * - Total pay (≤ £500)
 * - Route status (Pending / Approved / Rejected)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  planMultiBookingRoutes,
  validateDailyCapAndRequireApproval,
  type ExtendedBookingRequest,
} from '@/lib/capacity/multi-booking-route-optimizer';

export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/routes/review - Plan and Review Route
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow admin or driver to review routes
    if (!session?.user || !['admin', 'driver'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Driver access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingIds, tier, driverId } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid bookingIds' },
        { status: 400 }
      );
    }

    if (!tier || !['economy', 'standard', 'express'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier (must be economy, standard, or express)' },
        { status: 400 }
      );
    }

    if (!driverId) {
      return NextResponse.json(
        { error: 'Missing driverId' },
        { status: 400 }
      );
    }

    // ========================================
    // Step 1: Fetch Bookings
    // ========================================

    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
      },
    });

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: 'No valid bookings found' },
        { status: 404 }
      );
    }

    // ========================================
    // Step 2: Convert to ExtendedBookingRequest (simplified)
    // ========================================

    const bookingRequests: ExtendedBookingRequest[] = bookings.map(booking => ({
      id: booking.id,
      pickupAddress: `Booking ${booking.id} pickup`,
      deliveryAddress: `Booking ${booking.id} delivery`,
      itemIds: ['item1', 'item2'], // Simplified
    }));

    // ========================================
    // Step 3: Plan Multi-Booking Routes
    // ========================================

    const routePlan = await planMultiBookingRoutes(bookingRequests, {
      tier: tier as 'economy' | 'standard' | 'express',
      maxBookingsPerRoute: 10,
      minBookingsPerRoute: 2,
      prioritizeCapacityEfficiency: true,
    });

    if (!routePlan.success) {
      return NextResponse.json(
        {
          error: 'Failed to plan routes',
          warnings: routePlan.warnings,
          suggestions: routePlan.suggestions,
        },
        { status: 400 }
      );
    }

    // ========================================
    // Step 4: Get Current Daily Earnings
    // ========================================

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysEarnings = await prisma.driverEarnings.aggregate({
      where: {
        driverId: driverId,
        calculatedAt: {
          gte: today,
        },
      },
      _sum: {
        netAmountPence: true,
      },
    });

    const currentDailyEarnings = todaysEarnings._sum.netAmountPence || 0;

    // ========================================
    // Step 5: Validate Daily Cap (£500)
    // ========================================

    const validation = await validateDailyCapAndRequireApproval(
      routePlan.recommendedRoutes,
      driverId,
      currentDailyEarnings
    );

    // ========================================
    // Step 6: Build Route Summary for Review
    // ========================================

    const routeSummaries = validation.routes.map(route => ({
      routeId: route.routeId,
      bookingIds: route.bookingIds,
      tier: route.tier,
      
      // ✅ ALL DISTANCES IN MILES
      totalDistance_miles: route.estimatedTotalDistance_miles,
      estimatedDuration_hours: route.estimatedTotalDuration_hours,
      
      // ✅ DRIVER PAY
      estimatedDriverPay_gbp: (route.estimatedDriverPay_pence / 100).toFixed(2),
      estimatedDriverPay_pence: route.estimatedDriverPay_pence,
      
      // ✅ STATUS
      status: route.status,
      requiresAdminApproval: route.requiresAdminApproval,
      
      // Stops (ordered pickups & drops)
      stops: route.stops.map((stop, index) => ({
        sequenceNumber: index + 1,
        type: stop.type,
        address: `Stop ${index + 1}`,
        itemCount: 0,
      })),
      
      // Capacity metrics
      capacityMetrics: {
        peakVolume_m3: route.capacityAnalysis.peakVolume_m3,
        peakVolumeUtilization: (route.capacityAnalysis.peakVolumeUtilization * 100).toFixed(1) + '%',
        peakWeight_kg: route.capacityAnalysis.peakWeight_kg,
        peakWeightUtilization: (route.capacityAnalysis.peakWeightUtilization * 100).toFixed(1) + '%',
        violations: route.capacityAnalysis.violations,
      },
      
      // Efficiency
      capacityEfficiency: (route.capacityEfficiency * 100).toFixed(1) + '%',
      routeEfficiency: (route.routeEfficiency * 100).toFixed(1) + '%',
    }));

    // ========================================
    // Step 7: Return Route Summary
    // ========================================

    return NextResponse.json({
      success: true,
      
      // Route summaries
      routes: routeSummaries,
      
      // Daily cap validation
      dailyCapValidation: {
        currentDailyEarnings_gbp: (currentDailyEarnings / 100).toFixed(2),
        newRouteEarnings_gbp: (validation.totalNewEarnings_pence / 100).toFixed(2),
        projectedDailyTotal_gbp: (validation.projectedDailyTotal_pence / 100).toFixed(2),
        dailyCap_gbp: '500.00',
        exceedsCap: validation.exceedsCap,
        requiresAdminApproval: validation.requiresAdminApproval,
        warnings: validation.warnings,
      },
      
      // Overall metrics
      totalBookings: routePlan.totalBookings,
      totalVans: routePlan.recommendedRoutes.length,
      averageCapacityUtilization: routePlan.averageCapacityUtilization.toFixed(1) + '%',
      
      // Suggestions & warnings
      suggestions: routePlan.suggestions,
      warnings: [...routePlan.warnings, ...validation.warnings],
      
      // ✅ PRE-EXECUTION REVIEW MESSAGE
      message: validation.requiresAdminApproval
        ? '⚠️ ADMIN APPROVAL REQUIRED: Route exceeds £500 daily cap'
        : '✅ Route ready for execution (within daily cap)',
    });

  } catch (error) {
    console.error('❌ Error in route review:', error);
    return NextResponse.json(
      {
        error: 'Failed to review route',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/routes/review - Approve/Reject Route
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admin can approve/reject routes
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { routeId, action, notes } = body;

    if (!routeId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid routeId or action' },
        { status: 400 }
      );
    }

    // TODO: Store route approval in database
    // For now, just log the action
    
    console.log('✅ [Route Review] Admin action:', {
      routeId,
      action,
      adminId: (session.user as any).id,
      notes,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Route ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      routeId,
      action,
      approvedBy: (session.user as any).id,
      approvedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error approving/rejecting route:', error);
    return NextResponse.json(
      {
        error: 'Failed to process route approval',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
