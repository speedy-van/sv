import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import Pusher from 'pusher';

// Initialize Pusher for real-time updates
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'driver')
    return new Response('Unauthorized', { status: 401 });
  const userId = (session.user as any).id;
  const driver = await prisma.driver.findUnique({ 
    where: { userId },
    include: {
      User: {
        select: { name: true, email: true }
      }
    }
  });
  if (!driver) return new Response('Driver not found', { status: 404 });

  const { bookingId } = await req.json();
  if (!bookingId)
    return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

  try {
    let newAcceptanceRate = 100;

    await prisma.$transaction(async tx => {
      const offer = await tx.assignment.findFirst({ where: { bookingId, driverId: driver.id, status: 'invited' } });
      if (!offer)
        throw new Error('offer_invalid');
      await tx.assignment.update({
        where: { id: offer.id },
        data: { status: 'declined' },
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      // Update driver performance - decrease acceptance rate by 5%
      const performance = await tx.driverPerformance.findUnique({
        where: { driverId: driver.id }
      });

      if (performance) {
        // Decrease acceptance rate by 5%, but never below 0%
        const currentRate = performance.acceptanceRate || 100;
        newAcceptanceRate = Math.max(0, currentRate - 5);

        await tx.driverPerformance.update({
          where: { driverId: driver.id },
          data: {
            acceptanceRate: newAcceptanceRate,
            lastCalculated: new Date()
          }
        });
      }
    });

    // Send real-time notifications
    try {
      // 1. INSTANT REMOVAL: Remove job from driver's UI
      await pusher.trigger(`driver-${driver.id}`, 'job-removed', {
        jobId: bookingId,
        reason: 'declined',
        message: 'Job declined and removed from your schedule',
        timestamp: new Date().toISOString()
      });

      // 2. Update acceptance rate
      await pusher.trigger(`driver-${driver.id}`, 'acceptance-rate-updated', {
        acceptanceRate: newAcceptanceRate,
        change: -5,
        reason: 'job_declined',
        bookingId,
        timestamp: new Date().toISOString()
      });

      // 3. Notify admin channel
      await pusher.trigger('admin-drivers', 'driver-acceptance-rate-updated', {
        driverId: driver.id,
        driverName: driver.User?.name || 'Unknown',
        acceptanceRate: newAcceptanceRate,
        change: -5,
        reason: 'job_declined',
        bookingId,
        timestamp: new Date().toISOString()
      });

      // 4. Update driver schedule
      await pusher.trigger(`driver-${driver.id}`, 'schedule-updated', {
        type: 'job_removed',
        jobId: bookingId,
        acceptanceRate: newAcceptanceRate,
        timestamp: new Date().toISOString()
      });

      // 5. Update admin schedule
      await pusher.trigger('admin-schedule', 'driver-performance-updated', {
        driverId: driver.id,
        acceptanceRate: newAcceptanceRate,
        type: 'acceptance_rate_decreased',
        timestamp: new Date().toISOString()
      });

      // 6. Update admin/orders panel
      await pusher.trigger('admin-orders', 'order-status-changed', {
        jobId: bookingId,
        status: 'available',
        previousDriver: driver.id,
        driverName: driver.User?.name,
        reason: 'declined',
        timestamp: new Date().toISOString()
      });

      console.log('📡 Real-time notifications sent successfully');
    } catch (pusherError) {
      console.error('⚠️ Failed to send Pusher notifications:', pusherError);
    }

    // Auto-reassign to next available driver
    try {
      const availableDrivers = await prisma.driver.findMany({
        where: {
          id: { not: driver.id },
          status: 'active',
          onboardingStatus: 'approved',
          DriverAvailability: {
            status: 'online'
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
        // Filter by capacity
        const eligibleDrivers = availableDrivers.filter(d => {
          const availability = d.DriverAvailability;
          return availability && availability.currentCapacityUsed < availability.maxConcurrentDrops;
        });

        if (eligibleDrivers.length > 0) {
          // Offer to the best available driver (highest acceptance rate)
          const nextDriver = eligibleDrivers[0];
          
          // Create new assignment for next driver
          await prisma.assignment.create({
            data: {
              id: `assign_${bookingId}_${nextDriver.id}_${Date.now()}`,
              bookingId: bookingId,
              driverId: nextDriver.id,
              status: 'invited',
              round: 1,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
              updatedAt: new Date()
            }
          });

          // Notify next driver
          await pusher.trigger(`driver-${nextDriver.id}`, 'job-offer', {
            jobId: bookingId,
            message: `New job offer (reassigned from another driver)`,
            expiresIn: 600,
            timestamp: new Date().toISOString()
          });

          // Notify admin about reassignment
          await pusher.trigger('admin-orders', 'order-reassigned', {
            jobId: bookingId,
            previousDriver: driver.id,
            previousDriverName: driver.User?.name,
            newDriver: nextDriver.id,
            newDriverName: nextDriver.User?.name,
            timestamp: new Date().toISOString()
          });

          console.log(`✅ Job auto-reassigned to driver: ${nextDriver.User?.name}`);
        }
      }
    } catch (reassignError) {
      console.error('❌ Failed to auto-reassign job:', reassignError);
    }

    return NextResponse.json({ ok: true, acceptanceRate: newAcceptanceRate, change: -5 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 409 });
  }
}
