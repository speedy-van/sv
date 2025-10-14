import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/bonuses/request
 * 
 * Manually create a bonus request for a driver
 * 
 * Used when admin wants to award a bonus based on:
 * - Exceptional service
 * - Customer feedback
 * - Performance milestone
 * - Corrective action
 * 
 * Only accessible by admin users
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin-only authentication
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const adminId = (session.user as any).id;
    const adminName = (session.user as any).name || 'Admin';

    const body = await request.json();
    const {
      driver_id,
      assignment_id,
      bonus_type = 'manual_admin_bonus',
      requested_amount_pence,
      reason,
      auto_approve = false, // If true, immediately approve
    } = body;

    // Validation
    if (!driver_id) {
      return NextResponse.json(
        { error: 'driver_id is required' },
        { status: 400 }
      );
    }

    if (!assignment_id) {
      return NextResponse.json(
        { error: 'assignment_id is required' },
        { status: 400 }
      );
    }

    if (!requested_amount_pence || requested_amount_pence <= 0) {
      return NextResponse.json(
        { error: 'requested_amount_pence must be positive' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    // Verify driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driver_id },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Verify assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignment_id },
      include: {
        Booking: {
          select: {
            reference: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.driverId !== driver_id) {
      return NextResponse.json(
        { error: 'Assignment does not belong to this driver' },
        { status: 400 }
      );
    }

    // Create BonusRequest
    const prismaWithBonusRequest = prisma as any;
    
    if (!prismaWithBonusRequest.bonusRequest) {
      return NextResponse.json(
        { error: 'BonusRequest model not available. Run prisma generate.' },
        { status: 500 }
      );
    }

    const bonusRequest = await prismaWithBonusRequest.bonusRequest.create({
      data: {
        assignmentId: assignment_id,
        driverId: driver_id,
        bonusType: bonus_type,
        requestedAmountPence: requested_amount_pence,
        approvedAmountPence: auto_approve ? requested_amount_pence : null,
        status: auto_approve ? 'approved' : 'pending',
        reason,
        requestedBy: adminId, // Admin created it
        requestedAt: new Date(),
        reviewedBy: auto_approve ? adminId : null,
        reviewedAt: auto_approve ? new Date() : null,
        adminNotes: `Manually created by ${adminName}`,
      },
    });

    // If auto-approve, create AdminApproval audit record
    let adminApprovalId: string | undefined;

    if (auto_approve) {
      const prismaWithAdminApproval = prisma as any;
      
      if (prismaWithAdminApproval.adminApproval) {
        const adminApproval = await prismaWithAdminApproval.adminApproval.create({
          data: {
            type: 'bonus_approval',
            entityType: 'bonus_request',
            entityId: bonusRequest.id,
            adminId,
            adminName,
            action: 'approved',
            previousValue: null,
            newValue: {
              status: 'approved',
              amount: requested_amount_pence,
              createdAndApprovedBy: adminName,
            },
            reason: `Manual bonus creation: ${bonus_type}`,
            notes: reason,
            approvedAt: new Date(),
          },
        });
        adminApprovalId = adminApproval.id;
      }

      // Notify driver
      await prisma.driverNotification.create({
        data: {
          driverId: driver_id,
          type: 'payout_processed',
          title: 'Bonus Awarded! 🎉',
          message: `You've been awarded a ${bonus_type} bonus of £${(requested_amount_pence / 100).toFixed(2)}! ${reason}`,
          read: false,
        },
      });
    }

    logger.info('Admin created manual bonus request', {
      adminId,
      adminName,
      bonusRequestId: bonusRequest.id,
      driverId: driver_id,
      assignmentId: assignment_id,
      bonusType: bonus_type,
      amount: requested_amount_pence,
      autoApprove: auto_approve,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: auto_approve 
        ? 'Bonus created and automatically approved' 
        : 'Bonus request created successfully',
      data: {
        bonusRequestId: bonusRequest.id,
        driverId: driver_id,
        driverName: driver.User.name,
        assignmentId: assignment_id,
        bookingReference: assignment.Booking?.reference,
        bonusType: bonus_type,
        requestedAmount: requested_amount_pence,
        requestedAmountGBP: (requested_amount_pence / 100).toFixed(2),
        status: bonusRequest.status,
        reason,
        createdBy: adminName,
        createdAt: bonusRequest.requestedAt.toISOString(),
        adminApprovalId: auto_approve ? adminApprovalId : undefined,
      },
    });

  } catch (error) {
    logger.error('Error creating manual bonus request', error as Error, {
      service: 'admin-create-bonus',
    });
    
    return NextResponse.json(
      {
        error: 'Failed to create bonus request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
