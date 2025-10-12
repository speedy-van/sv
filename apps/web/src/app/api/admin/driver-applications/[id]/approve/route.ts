import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 [APPROVE DEBUG] Starting approval process for ID:', params.id);
    
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      console.log('❌ [APPROVE DEBUG] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const applicationId = params.id;
    const adminUserId = (session.user as any).id;
    console.log('🔧 [APPROVE DEBUG] Admin user ID:', adminUserId);

    // Get the application with additional validation
    let application;
    try {
      application = await prisma.driverApplication.findUnique({
        where: { id: applicationId },
      });
    } catch (dbError) {
      console.error('❌ [APPROVE DEBUG] Database error fetching application:', dbError);
      return NextResponse.json(
        { 
          error: 'Database error',
          details: 'Unable to fetch application from database'
        },
        { status: 500 }
      );
    }

    if (!application) {
      console.log('❌ [APPROVE DEBUG] Application not found:', applicationId);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    console.log('🔧 [APPROVE DEBUG] Application found:', {
      id: application.id,
      email: application.email,
      status: application.status,
      firstName: application.firstName,
      lastName: application.lastName,
    });

    if (application.status !== 'pending' && application.status !== 'under_review') {
      console.log('❌ [APPROVE DEBUG] Invalid application status:', application.status);
      return NextResponse.json(
        { 
          error: 'Application cannot be approved',
          details: `Application status is ${application.status}. Only pending or under_review applications can be approved.`
        },
        { status: 400 }
      );
    }

    // Use database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      console.log('🔧 [APPROVE DEBUG] Starting database transaction');

      // Check if user already exists
      const existingUser = await tx.user.findUnique({
        where: { email: application.email },
      });

      let userId: string;
      let user;

      if (existingUser) {
        console.log('🔧 [APPROVE DEBUG] Existing user found:', existingUser.id);
        
        // User exists, check if they're already a driver
        const existingDriver = await tx.driver.findUnique({
          where: { userId: existingUser.id },
        });

        if (existingDriver) {
          console.log('❌ [APPROVE DEBUG] User is already a driver');
          throw new Error('User is already a driver');
        }

        // Update existing user to driver role
        user = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'driver',
            isActive: true,
          },
        });
        userId = existingUser.id;
        console.log('🔧 [APPROVE DEBUG] Updated existing user to driver role');
      } else {
        console.log('🔧 [APPROVE DEBUG] Creating new user');
        // Create new user
        const tempPassword = randomBytes(8).toString('hex');
        user = await tx.user.create({
          data: {
            email: application.email,
            name: `${application.firstName} ${application.lastName}`,
            role: 'driver',
            password: tempPassword,
            isActive: true,
          },
        });
        userId = user.id;
        console.log('🔧 [APPROVE DEBUG] New user created:', user.id);
      }

      // Create driver record
      console.log('🔧 [APPROVE DEBUG] Creating driver record');
      const driver = await tx.driver.create({
        data: {
          userId: userId,
          status: 'active',
          onboardingStatus: 'approved',
          approvedAt: new Date(),
        },
      });
      console.log('🔧 [APPROVE DEBUG] Driver record created:', driver.id);

      // Create driver availability record
      console.log('🔧 [APPROVE DEBUG] Creating driver availability record');
      await tx.driverAvailability.create({
        data: {
          driverId: driver.id,
          status: 'offline',
          locationConsent: false,
        },
      });
      console.log('🔧 [APPROVE DEBUG] Driver availability record created');

      // Create driver performance record
      console.log('🔧 [APPROVE DEBUG] Creating driver performance record');
      await tx.driverPerformance.create({
        data: {
          driverId: driver.id,
          averageRating: 0,
          totalRatings: 0,
          completionRate: 0,
          acceptanceRate: 0,
          onTimeRate: 0,
          cancellationRate: 0,
          totalJobs: 0,
          completedJobs: 0,
          cancelledJobs: 0,
          lateJobs: 0,
        },
      });
      console.log('🔧 [APPROVE DEBUG] Driver performance record created');

      // Create driver notification preferences
      console.log('🔧 [APPROVE DEBUG] Creating driver notification preferences');
      await tx.driverNotificationPreferences.create({
        data: {
          driverId: driver.id,
          pushJobOffers: true,
          pushJobUpdates: true,
          emailJobOffers: true,
          emailJobUpdates: true,
          smsJobOffers: false,
          smsJobUpdates: false,
        },
      });
      console.log('🔧 [APPROVE DEBUG] Driver notification preferences created');

      // Update application status
      console.log('🔧 [APPROVE DEBUG] Updating application status');
      await tx.driverApplication.update({
        where: { id: applicationId },
        data: {
          status: 'approved',
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
        },
      });
      console.log('🔧 [APPROVE DEBUG] Application status updated');

      // Create driver notification
      console.log('🔧 [APPROVE DEBUG] Creating driver notification');
      await tx.driverNotification.create({
        data: {
          driverId: driver.id,
          type: 'job_offer',
          title: 'Welcome to Speedy Van! 🎉',
          message: 'Your driver application has been approved. You can now start accepting jobs and earning money!',
          read: false,
        },
      });
      console.log('🔧 [APPROVE DEBUG] Driver notification created');

      return { driver, user };
    });

    console.log('✅ Driver application approved successfully:', {
      applicationId,
      driverId: result.driver.id,
      userId: result.user.id,
      email: application.email,
      fullName: `${application.firstName} ${application.lastName}`,
      approvedBy: adminUserId,
    });

    // Send approval email (outside transaction to avoid email failures affecting approval)
    try {
      console.log('🔧 [APPROVE DEBUG] Sending approval email');
      const emailResult = await unifiedEmailService.sendDriverApplicationStatus({
        driverEmail: application.email,
        driverName: `${application.firstName} ${application.lastName}`,
        applicationId: application.id,
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        nextSteps: [
          'You will receive separate login credentials via email',
          'Log in to the driver portal to start working',
          'Download the Speedy Van driver app for easy job management',
          'Begin accepting jobs and earning money immediately',
        ],
      });

      if (emailResult.success) {
        console.log('✅ Driver application approval email sent:', {
          applicationId: application.id,
          email: application.email,
          messageId: emailResult.messageId,
          provider: emailResult.provider,
        });
      } else {
        console.warn('⚠️ Failed to send driver application approval email:', {
          applicationId: application.id,
          email: application.email,
          error: emailResult.error,
        });
      }
    } catch (emailError) {
      console.error('❌ Error sending driver application approval email:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Driver application approved successfully',
      data: {
        applicationId,
        driverId: result.driver.id,
        userId: result.user.id,
        email: application.email,
        fullName: `${application.firstName} ${application.lastName}`,
        status: 'approved',
        nextSteps: [
          'Driver account has been created',
          'Driver can now log in to the driver portal',
          'Driver will receive welcome notification',
          'Driver can start accepting jobs immediately',
        ],
      },
    });

  } catch (error) {
    console.error('❌ Error approving driver application:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      applicationId: params.id,
      errorType: error?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString(),
    });

    // Provide more specific error information for debugging
    let errorMessage = 'Failed to approve application';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'User already exists as a driver';
        errorDetails = 'This email is already registered as a driver in the system';
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Database relationship error';
        errorDetails = 'There was an issue with the database relationships';
      } else if (error.message.includes('Connection')) {
        errorMessage = 'Database connection error';
        errorDetails = 'Unable to connect to the database';
      } else if (error.message.includes('Transaction')) {
        errorMessage = 'Database transaction error';
        errorDetails = 'The database transaction failed';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        applicationId: params.id,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
