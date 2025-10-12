/**
 * Diagnostic Tool for Booking SVMG3YFW3DLUPQ
 * This script helps identify why the booking is not appearing in driver jobs
 */

// Manual check function - you can run this in your browser console on the admin page
function checkBookingStatus() {
  console.log('🔍 Booking Diagnostic Tool');
  console.log('========================');
  console.log('Booking Reference: SVMG3YFW3DLUPQ');
  console.log('');
  
  console.log('📋 Expected Conditions for Driver Job Visibility:');
  console.log('1. status = "CONFIRMED"');
  console.log('2. driverId = null (not assigned)');
  console.log('3. scheduledAt > current time (future booking)');
  console.log('4. No existing Assignment record');
  console.log('');
  
  console.log('🛠️ Debugging Steps:');
  console.log('1. Check booking status in admin dashboard');
  console.log('2. Verify payment was successful (should have paidAt timestamp)');
  console.log('3. Check if driverId is null');
  console.log('4. Verify scheduledAt is in the future');
  console.log('5. Check for Assignment records');
  console.log('');
  
  console.log('🔧 Potential Fixes:');
  console.log('1. If status is PENDING_PAYMENT: Complete payment or manually confirm');
  console.log('2. If driverId is assigned: Remove driver assignment');
  console.log('3. If scheduledAt is past: Update scheduling time');
  console.log('4. If Assignment exists: Remove or update assignment record');
}

// API endpoint to check booking status (add this to your Next.js API)
const diagnosticAPIEndpoint = `
// File: /api/admin/diagnostic/booking/[reference]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { reference } = params;

    // Get booking with all related data
    const booking = await prisma.booking.findFirst({
      where: { reference },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        driver: {
          include: {
            user: true
          }
        },
        Assignment: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found', reference },
        { status: 404 }
      );
    }

    // Check driver jobs eligibility
    const now = new Date();
    const isConfirmed = booking.status === 'CONFIRMED';
    const hasNoDriver = booking.driverId === null;
    const isInFuture = booking.scheduledAt > now;
    const hasNoAssignment = !booking.Assignment;

    const shouldAppearInJobs = isConfirmed && hasNoDriver && isInFuture && hasNoAssignment;

    // Count total eligible jobs
    const totalEligibleJobs = await prisma.booking.count({
      where: {
        status: 'CONFIRMED',
        driverId: null,
        scheduledAt: { gte: now }
      }
    });

    return NextResponse.json({
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        driverId: booking.driverId,
        scheduledAt: booking.scheduledAt,
        createdAt: booking.createdAt,
        paidAt: booking.paidAt,
        customerName: booking.customerName,
        driverName: booking.driver?.user?.name || null,
        hasAssignment: !!booking.Assignment,
        assignmentStatus: booking.Assignment?.status || null
      },
      eligibility: {
        isConfirmed,
        hasNoDriver,
        isInFuture,
        hasNoAssignment,
        shouldAppearInJobs,
        reasons: [
          !isConfirmed && \`Status is \${booking.status}, not CONFIRMED\`,
          !hasNoDriver && \`Already assigned to driver: \${booking.driver?.user?.name}\`,
          !isInFuture && \`Scheduled time is in the past: \${booking.scheduledAt}\`,
          !hasNoAssignment && \`Has assignment record: \${booking.Assignment?.status}\`
        ].filter(Boolean)
      },
      context: {
        totalEligibleJobs,
        currentTime: now
      }
    });

  } catch (error) {
    console.error('❌ Diagnostic API error:', error);
    return NextResponse.json(
      { error: 'Diagnostic failed' },
      { status: 500 }
    );
  }
}
`;

// Manual fixes that can be applied via admin
const manualFixes = `
-- Fix 1: If booking is PENDING_PAYMENT, manually confirm it
UPDATE "Booking" 
SET status = 'CONFIRMED', paidAt = NOW() 
WHERE reference = 'SVMG3YFW3DLUPQ' AND status = 'PENDING_PAYMENT';

-- Fix 2: If booking has a driver assigned, remove assignment
UPDATE "Booking" 
SET driverId = NULL 
WHERE reference = 'SVMG3YFW3DLUPQ';

-- Fix 3: Remove any assignment records
DELETE FROM "Assignment" 
WHERE bookingId IN (
  SELECT id FROM "Booking" WHERE reference = 'SVMG3YFW3DLUPQ'
);

-- Fix 4: If scheduled time is in the past, update it to tomorrow
UPDATE "Booking" 
SET scheduledAt = (CURRENT_TIMESTAMP + INTERVAL '1 day')
WHERE reference = 'SVMG3YFW3DLUPQ' AND scheduledAt < NOW();
`;

console.log('🚀 Run checkBookingStatus() to see debugging steps');
console.log('');
console.log('📁 Files created:');
console.log('- diagnostic-queries.sql: Database queries to check booking status');
console.log('- API endpoint code above for programmatic checking');

export { checkBookingStatus, diagnosticAPIEndpoint, manualFixes };