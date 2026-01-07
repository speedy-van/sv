/**
 * Company Usage Stats API
 * 
 * GET /api/company/usage
 * 
 * Returns order limit usage and statistics for the authenticated company.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCompanySession } from '@/lib/auth/company-middleware';
import { orderLimitService } from '@/lib/b2b/order-limit.service';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyCompanySession();
    if (!auth.authenticated || !auth.session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get usage statistics
    const stats = await orderLimitService.getUsageStats(auth.session.companyId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}
