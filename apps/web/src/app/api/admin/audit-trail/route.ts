/**
 * Admin Audit Trail API
 * GET /api/admin/audit-trail
 * Returns all AdminApproval records with filtering options
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entity_type');
    const adminId = searchParams.get('admin_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (dateFrom) {
      where.approvedAt = {
        ...where.approvedAt,
        gte: new Date(dateFrom),
      };
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      where.approvedAt = {
        ...where.approvedAt,
        lte: toDate,
      };
    }

    // Check if AdminApproval model exists
    const hasAdminApprovalModel = (prisma as any).adminApproval !== undefined;

    if (!hasAdminApprovalModel) {
      console.warn('⚠️ AdminApproval model not available yet (prisma generate needed)');
      return NextResponse.json({
        success: true,
        count: 0,
        audits: [],
        message: 'AdminApproval model not available - run prisma generate',
      });
    }

    // Query AdminApproval records
    const [audits, totalCount] = await Promise.all([
      (prisma as any).adminApproval.findMany({
        where,
        orderBy: {
          approvedAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      (prisma as any).adminApproval.count({ where }),
    ]);

    // Format response
    const formattedAudits = audits.map((audit: any) => ({
      id: audit.id,
      type: audit.type,
      entityType: audit.entityType,
      entityId: audit.entityId,
      adminId: audit.adminId,
      adminName: audit.adminName || null,
      action: audit.action,
      previousValue: audit.previousValue || null,
      newValue: audit.newValue || null,
      reason: audit.reason || null,
      notes: audit.notes || null,
      approvedAt: audit.approvedAt.toISOString(),
    }));

    console.log(`✅ Retrieved ${formattedAudits.length} audit records (total: ${totalCount})`);

    return NextResponse.json({
      success: true,
      count: formattedAudits.length,
      totalCount,
      audits: formattedAudits,
      pagination: {
        limit,
        offset,
        hasMore: offset + formattedAudits.length < totalCount,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching audit trail:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch audit trail',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
