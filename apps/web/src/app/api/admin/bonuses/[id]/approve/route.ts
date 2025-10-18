import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import Pusher from 'pusher';

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/bonuses/[id]/approve
 * 
 * Approve or reject a bonus request
 * 
 * If approved:
 * - Updates BonusRequest status to 'approved'
 * - Sets approvedAmountPence
 * - Creates AdminApproval audit record
 * - If bonus was blocking job completion, triggers earnings creation
 * - Notifies driver
 * 
 * Only accessible by admin users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bonusRequestId } = await params;

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
      action = 'approved', // 'approved' or 'rejected'
      approved_amount_pence, // Optional: override requested amount
      admin_notes,
    } = body;

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Get bonus request
    const prismaWithBonusRequest = prisma as any;
    
    if (!prismaWithBonusRequest.bonusRequest) {
      return NextResponse.json(
        { error: 'BonusRequest model not available. Run prisma generate.' },
        { status: 500 }
      );
    }

    const bonusRequest = await prismaWithBonusRequest.bonusRequest.findUnique({
      where: { id: bonusRequestId },
      include: {
        driver: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        assignment: {
          include: {
            Booking: {
              select: {
                reference: true,
              },
            },
          },
        },
      },
    });

    if (!bonusRequest) {
      return NextResponse.json(
        { error: 'Bonus request not found' },
        { status: 404 }
      );
    }

    if (bonusRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Bonus request already ${bonusRequest.status}` },
        { status: 409 }
      );
    }

    // Determine final amount
    const finalAmount = action === 'approved' 
      ? (approved_amount_pence || bonusRequest.requestedAmountPence)
      : 0;

    // Update BonusRequest
    const updatedBonus = await prismaWithBonusRequest.bonusRequest.update({
      where: { id: bonusRequestId },
      data: {
        status: action,
        approvedAmountPence: finalAmount,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes: admin_notes || undefined,
      },
    });

    // Create AdminApproval audit record
    const prismaWithAdminApproval = prisma as any;
    let adminApprovalId: string | undefined;

    if (prismaWithAdminApproval.adminApproval) {
      const adminApproval = await prismaWithAdminApproval.adminApproval.create({
        data: {
          type: 'bonus_approval',
          entityType: 'bonus_request',
          entityId: bonusRequestId,
          adminId,
          adminName,
          action,
          previousValue: {
            status: 'pending',
            requestedAmount: bonusRequest.requestedAmountPence,
            bonusType: bonusRequest.bonusType,
            reason: bonusRequest.reason,
          },
          newValue: {
            status: action,
            approvedAmount: finalAmount,
            reviewedBy: adminName,
          },
          reason: action === 'approved' 
            ? `Bonus approved: ${bonusRequest.bonusType}`
            : `Bonus rejected: ${bonusRequest.bonusType}`,
          notes: admin_notes || undefined,
          approvedAt: new Date(),
        },
      });
      adminApprovalId = adminApproval.id;
    }

    // If approved, create a DriverEarnings record for the bonus
    if (action === 'approved') {
      // Create bonus earnings record
      await prisma.driverEarnings.create({
        data: {
          driverId: bonusRequest.driverId,
          assignmentId: bonusRequest.assignmentId || null,
          baseAmountPence: 0, // Bonuses don't have base amounts
          surgeAmountPence: 0, // Bonuses don't have surge amounts
          tipAmountPence: 0, // Bonuses don't have tips
          feeAmountPence: 0, // Bonuses don't have platform fees
          netAmountPence: finalAmount,
          currency: 'gbp',
          calculatedAt: new Date(),
          paidOut: false,
        },
      });
    }

    // Notify driver
    const notificationType = action === 'approved' ? 'payout_processed' : 'system_alert';
    const notificationTitle = action === 'approved'
      ? 'Bonus Approved! 🎉'
      : 'Bonus Request Update';
    const notificationMessage = action === 'approved'
      ? `Your ${bonusRequest.bonusType} bonus request for £${(finalAmount / 100).toFixed(2)} has been approved and added to your earnings!`
      : `Your bonus request has been reviewed. ${admin_notes ? `Note: ${admin_notes}` : ''}`;

    await prisma.driverNotification.create({
      data: {
        driverId: bonusRequest.driverId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        read: false,
      },
    });

    // Send real-time notification
    try {
      await pusher.trigger(`driver-${bonusRequest.driverId}`, 'bonus-decision', {
        bonusRequestId,
        action,
        amount: finalAmount,
        amountGBP: (finalAmount / 100).toFixed(2),
        bonusType: bonusRequest.bonusType,
        reviewedBy: adminName,
        notes: admin_notes,
        timestamp: new Date().toISOString(),
      });
    } catch (pusherError) {
      logger.error('Failed to send real-time bonus decision notification', pusherError as Error);
    }

    logger.info(`Admin ${action} bonus request`, {
      adminId,
      adminName,
      bonusRequestId,
      driverId: bonusRequest.driverId,
      bonusType: bonusRequest.bonusType,
      requestedAmount: bonusRequest.requestedAmountPence,
      approvedAmount: finalAmount,
      adminNotes: admin_notes,
    });

    return NextResponse.json({
      success: true,
      action,
      message: `Bonus ${action} successfully`,
      data: {
        bonusRequestId,
        driverId: bonusRequest.driverId,
        driverName: bonusRequest.driver.user.name,
        bonusType: bonusRequest.bonusType,
        requestedAmount: bonusRequest.requestedAmountPence,
        approvedAmount: finalAmount,
        reviewedBy: adminName,
        reviewedAt: new Date().toISOString(),
        adminApprovalId,
        assignmentId: bonusRequest.assignmentId,
        bookingReference: bonusRequest.assignment?.Booking?.reference,
      },
    });

  } catch (error) {
    logger.error('Error processing bonus decision', error as Error, {
      service: 'admin-bonus-approve',
      requestId: bonusRequestId,
    });
    
    return NextResponse.json(
      {
        error: 'Failed to process bonus decision',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
