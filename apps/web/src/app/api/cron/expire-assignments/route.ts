import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

/**
 * Cron Job: Expire Assignments
 * 
 * This endpoint should be called every 1 minute by:
 * - Vercel Cron (vercel.json config)
 * - External cron service (e.g., cron-job.org)
 * - GitHub Actions (scheduled workflow)
 * 
 * It checks for expired assignments and:
 * 1. Marks them as declined
 * 2. Decreases driver acceptance rate by 5%
 * 3. Auto-reassigns to next available driver
 * 4. Sends real-time notifications
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max execution time

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'default-secret-change-in-production';

  // Verify cron secret to prevent unauthorized access
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    console.log(`⏰ [${now.toISOString()}] Running assignment expiry check...`);

    // Find all claimed AND invited assignments that have expired
    const expiredAssignments = await prisma.assignment.findMany({
      where: {
        status: { in: ['claimed', 'invited'] }, // Check both statuses
        expiresAt: {
          lt: now,
        },
      },
      include: {
        Booking: true,
        Driver: {
          include: {
            User: true,
            DriverPerformance: true,
          }
        }
      },
    });

    if (expiredAssignments.length === 0) {
      console.log('✅ No expired assignments found');
      return NextResponse.json({
        success: true,
        message: 'No expired assignments found',
        expiredCount: 0,
        timestamp: now.toISOString(),
      });
    }

    console.log(`🔴 Found ${expiredAssignments.length} expired assignment(s)`);

    const pusher = getPusherServer();

    // Process each expired assignment
    const results = await Promise.all(
      expiredAssignments.map(async (assignment) => {
        try {
          console.log(`⏰ Expiring assignment ${assignment.id} for driver ${assignment.driverId}`);
          
          let newAcceptanceRate = 100;
          
          await prisma.$transaction(async (tx) => {
            // Update assignment status to declined
            await tx.assignment.update({
              where: { id: assignment.id },
              data: { 
                status: 'declined',
                updatedAt: now,
              },
            });

            // Reset booking to make it available again
            await tx.booking.update({
              where: { id: assignment.bookingId },
              data: {
                driverId: null,
                status: 'CONFIRMED',
              },
            });

            // Apply acceptance rate penalty (same as manual decline)
            const performance = await tx.driverPerformance.findUnique({
              where: { driverId: assignment.driverId }
            });

            if (performance) {
              const currentRate = performance.acceptanceRate || 100;
              newAcceptanceRate = Math.max(0, currentRate - 5); // Decrease by 5%

              await tx.driverPerformance.update({
                where: { driverId: assignment.driverId },
                data: {
                  acceptanceRate: newAcceptanceRate,
                  lastCalculated: now
                }
              });

              console.log(`📉 Decreased acceptance rate for driver ${assignment.driverId} from ${currentRate}% to ${newAcceptanceRate}%`);
            }
          });

          // Send real-time notifications to driver
          try {
            await pusher.trigger(`driver-${assignment.driverId}`, 'job-removed', {
              jobId: assignment.bookingId,
              assignmentId: assignment.id,
              reason: 'expired',
              message: 'Assignment expired - You did not accept within 30 minutes',
              timestamp: now.toISOString()
            });

            await pusher.trigger(`driver-${assignment.driverId}`, 'acceptance-rate-updated', {
              acceptanceRate: newAcceptanceRate,
              change: -5,
              reason: 'assignment_expired',
              jobId: assignment.bookingId,
              timestamp: now.toISOString()
            });

            // Notify admin dashboard
            await pusher.trigger('admin-orders', 'order-status-changed', {
              jobId: assignment.bookingId,
              status: 'available',
              previousDriver: assignment.driverId,
              driverName: assignment.Driver?.User?.name,
              reason: 'expired',
              timestamp: now.toISOString()
            });
          } catch (pusherError) {
            console.error('⚠️ Failed to send Pusher notifications:', pusherError);
          }

          // Auto-reassign to next available driver
          try {
            const availableDrivers = await prisma.driver.findMany({
              where: {
                id: { not: assignment.driverId },
                status: 'active',
                onboardingStatus: 'approved',
                DriverAvailability: {
                  status: { in: ['online', 'available'] }
                }
              },
              include: {
                User: { select: { name: true, email: true } },
                DriverAvailability: true,
                DriverPerformance: true
              },
              orderBy: {
                DriverPerformance: {
                  acceptanceRate: 'desc'
                }
              },
              take: 5
            });

            if (availableDrivers.length > 0) {
              const nextDriver = availableDrivers[0];
              
              // Create new assignment for next driver
              await prisma.assignment.create({
                data: {
                  id: `assign_${assignment.bookingId}_${nextDriver.id}_${Date.now()}`,
                  bookingId: assignment.bookingId,
                  driverId: nextDriver.id,
                  status: 'invited',
                  round: (assignment.round || 1) + 1,
                  expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
                  updatedAt: now
                }
              });

              // Notify next driver
              await pusher.trigger(`driver-${nextDriver.id}`, 'route-matched', {
                type: 'single-order',
                matchType: 'order',
                jobCount: 1,
                bookingId: assignment.Booking?.id,
                bookingReference: assignment.Booking?.reference,
                assignmentId: assignment.id,
                message: 'New job offer (auto-reassigned)',
                expiresInSeconds: 1800,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                timestamp: now.toISOString()
              });

              console.log(`✅ Job auto-reassigned to driver: ${nextDriver.User?.name}`);
              
              return {
                assignmentId: assignment.id,
                expired: true,
                reassigned: true,
                reassignedTo: nextDriver.User?.name
              };
            } else {
              console.log('⚠️ No available drivers for auto-reassignment');
              return {
                assignmentId: assignment.id,
                expired: true,
                reassigned: false,
                reason: 'no_available_drivers'
              };
            }
          } catch (reassignError) {
            console.error('❌ Failed to auto-reassign job:', reassignError);
            return {
              assignmentId: assignment.id,
              expired: true,
              reassigned: false,
              error: reassignError instanceof Error ? reassignError.message : 'Unknown error'
            };
          }
        } catch (error) {
          console.error(`❌ Error processing assignment ${assignment.id}:`, error);
          return {
            assignmentId: assignment.id,
            expired: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const successCount = results.filter(r => r.expired).length;
    const reassignedCount = results.filter(r => r.reassigned).length;

    console.log(`✅ Expired ${successCount}/${expiredAssignments.length} assignments`);
    console.log(`✅ Reassigned ${reassignedCount}/${successCount} assignments`);

    return NextResponse.json({
      success: true,
      message: `Expired ${successCount} assignments, reassigned ${reassignedCount}`,
      expiredCount: successCount,
      reassignedCount,
      results,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('❌ Error in expiry cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Support POST for manual trigger (useful for testing)
export async function POST(request: NextRequest) {
  return GET(request);
}

