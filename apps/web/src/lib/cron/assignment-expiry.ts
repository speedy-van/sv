/**
 * Assignment Expiry Cron Job
 * 
 * Runs every 1 minute to check for expired assignments and auto-reassign them.
 * This works on any platform (Render, Railway, Heroku, etc.)
 */

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

let cronJob: cron.ScheduledTask | null = null;

/**
 * Start the assignment expiry cron job
 * Called automatically when server starts
 */
export function startAssignmentExpiryCron() {
  // Prevent multiple cron jobs
  if (cronJob) {
    console.log('⚠️ Assignment expiry cron already running');
    return;
  }

  // Run every minute: */1 * * * * or 0 * * * * *
  cronJob = cron.schedule('* * * * *', async () => {
    try {
      await checkAndExpireAssignments();
    } catch (error) {
      console.error('❌ Error in assignment expiry cron:', error);
    }
  });

  console.log('✅ Assignment expiry cron job started (runs every 1 minute)');
}

/**
 * Stop the assignment expiry cron job
 * Useful for testing or graceful shutdown
 */
export function stopAssignmentExpiryCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('🛑 Assignment expiry cron job stopped');
  }
}

/**
 * Check for expired assignments and process them
 */
async function checkAndExpireAssignments() {
  const now = new Date();
  console.log(`⏰ [${now.toISOString()}] Running assignment expiry check...`);

  try {
    // Find all claimed AND invited assignments that have expired
    const expiredAssignments = await prisma.assignment.findMany({
      where: {
        status: { in: ['claimed', 'invited'] },
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
      return;
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

            // Apply acceptance rate penalty
            const performance = await tx.driverPerformance.findUnique({
              where: { driverId: assignment.driverId }
            });

            if (performance) {
              const currentRate = performance.acceptanceRate || 100;
              newAcceptanceRate = Math.max(0, currentRate - 5);

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

          // Send real-time notifications
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
              
              // ✅ Find existing assignment or create new one (bookingId is not unique)
              const existingAssignment = await prisma.assignment.findFirst({
                where: { bookingId: assignment.bookingId }
              });

              if (existingAssignment) {
                await prisma.assignment.update({
                  where: { id: existingAssignment.id },
                  data: {
                    driverId: nextDriver.id,
                    status: 'invited',
                    round: (assignment.round || 1) + 1,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                    updatedAt: now
                  }
                });
              } else {
                await prisma.assignment.create({
                  data: {
                    id: `assign_${assignment.bookingId}_${nextDriver.id}_${Date.now()}`,
                    bookingId: assignment.bookingId,
                    driverId: nextDriver.id,
                    status: 'invited',
                    round: (assignment.round || 1) + 1,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                    updatedAt: now
                  }
                });
              }

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
              return { expired: true, reassigned: true };
            } else {
              console.log('⚠️ No available drivers for auto-reassignment');
              return { expired: true, reassigned: false };
            }
          } catch (reassignError) {
            console.error('❌ Failed to auto-reassign job:', reassignError);
            return { expired: true, reassigned: false };
          }
        } catch (error) {
          console.error(`❌ Error processing assignment ${assignment.id}:`, error);
          return { expired: false };
        }
      })
    );

    const successCount = results.filter(r => r.expired).length;
    const reassignedCount = results.filter(r => r.reassigned).length;

    console.log(`✅ Expired ${successCount}/${expiredAssignments.length} assignments`);
    console.log(`✅ Reassigned ${reassignedCount}/${successCount} assignments`);

  } catch (error) {
    console.error('❌ Error checking expired assignments:', error);
  }
}

