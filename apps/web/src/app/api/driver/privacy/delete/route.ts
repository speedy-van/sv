import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason, password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password required for account deletion' },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
      include: { 
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            // password should be selected explicitly if required
            password: true,
            isActive: true
          }
        }
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(
      password,
      driver.User.password
    );

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
    }

    // Check if driver has active jobs
    const activeAssignments = await prisma.assignment.findMany({
      where: {
        driverId: driver.id,
        status: {
          in: ['claimed', 'accepted'],
        },
      },
    });

    if (activeAssignments.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete account with active jobs. Please complete or cancel all active jobs first.',
        },
        { status: 400 }
      );
    }

    // Check if driver has pending payouts
    const pendingPayouts = await prisma.driverPayout.findMany({
      where: {
        driverId: driver.id,
        status: 'pending',
      },
    });

    if (pendingPayouts.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete account with pending payouts. Please wait for payouts to be processed.',
        },
        { status: 400 }
      );
    }

    // Create deletion request instead of immediate deletion
    const deletionRequest = await prisma.accountDeletionRequest.create({
      data: {
        userId: session.user.id,
        driverId: driver.id,
        reason: reason || 'No reason provided',
        requestedAt: new Date(),
        status: 'pending',
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Log the deletion request for audit purposes
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: 'driver',
        action: 'ACCOUNT_DELETION_REQUESTED',
        targetType: 'account_deletion_request',
        targetId: deletionRequest.id,
        before: undefined,
        after: {
          driverId: driver.id,
          reason: reason,
          scheduledFor: deletionRequest.scheduledFor,
          deletionRequestId: deletionRequest.id,
        },
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Send confirmation email (you can implement this later)
    // await sendDeletionConfirmationEmail(driver.user.email, deletionRequest.scheduledFor);

    return NextResponse.json({
      success: true,
      message:
        'Account deletion request submitted successfully. Your account will be permanently deleted in 30 days unless you cancel the request.',
      scheduledFor: deletionRequest.scheduledFor,
      deletionRequestId: deletionRequest.id,
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow users to cancel their deletion request
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletionRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId: session.user.id,
        status: 'pending',
      },
    });

    if (!deletionRequest) {
      return NextResponse.json(
        { error: 'No pending deletion request found' },
        { status: 404 }
      );
    }

    // Cancel the deletion request
    await prisma.accountDeletionRequest.update({
      where: { id: deletionRequest.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    // Log the cancellation
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: 'driver',
        action: 'ACCOUNT_DELETION_CANCELLED',
        targetType: 'account_deletion_request',
        targetId: deletionRequest.id,
        before: undefined,
        after: {
          deletionRequestId: deletionRequest.id,
        },
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deletion request cancelled successfully',
    });
  } catch (error) {
    console.error('Account deletion cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get deletion request status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletionRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId: session.user.id,
        status: 'pending',
      },
    });

    return NextResponse.json({
      hasPendingDeletion: !!deletionRequest,
      deletionRequest: deletionRequest
        ? {
            id: deletionRequest.id,
            reason: deletionRequest.reason,
            requestedAt: deletionRequest.requestedAt,
            scheduledFor: deletionRequest.scheduledFor,
          }
        : null,
    });
  } catch (error) {
    console.error('Get deletion request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

