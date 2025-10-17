import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateEmailForSending } from '@/lib/email/email-validation';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🧹 Starting email cleanup process...');

    const stats = {
      totalChecked: 0,
      invalidEmails: 0,
      suppressedEmails: 0,
      errors: [] as string[]
    };

    // Check user emails
    console.log('📧 Fetching all user emails...');
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: ''
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    stats.totalChecked = users.length;
    console.log(`📊 Found ${users.length} users to check`);

    const invalidUsers: Array<{ id: string; email: string; name: string | null; error: string }> = [];

    for (const user of users) {
      if (!user.email) continue;

      try {
        const validation = validateEmailForSending(user.email);
        
        if (!validation.isValid) {
          stats.invalidEmails++;
          invalidUsers.push({
            id: user.id,
            email: user.email,
            name: user.name,
            error: validation.error || 'Unknown error'
          });
          
          if (validation.shouldSuppress) {
            stats.suppressedEmails++;
          }
        }
      } catch (error) {
        stats.errors.push(`Error checking ${user.email}: ${error}`);
      }
    }

    // Check booking emails
    console.log('📦 Checking booking emails...');
    const bookings = await prisma.booking.findMany({
      where: {
        customerEmail: {
          not: ''
        }
      },
      select: {
        id: true,
        customerEmail: true,
        customerName: true
      }
    });

    console.log(`📊 Found ${bookings.length} bookings to check`);

    const invalidBookings: Array<{ id: string; email: string; name: string | null; error: string }> = [];

    for (const booking of bookings) {
      if (!booking.customerEmail) continue;

      try {
        const validation = validateEmailForSending(booking.customerEmail);
        
        if (!validation.isValid) {
          stats.invalidEmails++;
          invalidBookings.push({
            id: booking.id,
            email: booking.customerEmail,
            name: booking.customerName,
            error: validation.error || 'Unknown error'
          });
          
          if (validation.shouldSuppress) {
            stats.suppressedEmails++;
          }
        }
      } catch (error) {
        stats.errors.push(`Error checking booking ${booking.id}: ${error}`);
      }
    }

    // Calculate bounce rate
    const estimatedBounceRate = stats.totalChecked > 0 ? 
      (stats.invalidEmails / stats.totalChecked) * 100 : 0;

    // Determine severity
    const severity = estimatedBounceRate > 5 ? 'critical' : 
                    estimatedBounceRate > 2 ? 'warning' : 'good';

    console.log('✅ Email cleanup completed!');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      statistics: {
        totalChecked: stats.totalChecked + bookings.length,
        invalidEmails: stats.invalidEmails,
        suppressedEmails: stats.suppressedEmails,
        errors: stats.errors.length,
        bounceRate: estimatedBounceRate.toFixed(2) + '%',
        severity
      },
      details: {
        invalidUsers: invalidUsers.slice(0, 10), // First 10 only
        invalidBookings: invalidBookings.slice(0, 10), // First 10 only
        totalInvalidUsers: invalidUsers.length,
        totalInvalidBookings: invalidBookings.length
      },
      recommendations: estimatedBounceRate > 5 ? [
        '🚨 CRITICAL: High bounce rate detected!',
        'Review email collection processes',
        'Implement double opt-in verification',
        'Update invalid email addresses immediately'
      ] : estimatedBounceRate > 2 ? [
        '⚠️  CAUTION: Moderate bounce rate',
        'Monitor closely',
        'Consider improving validation'
      ] : [
        '✅ Good bounce rate - continue monitoring'
      ],
      nextSteps: [
        'Review invalid emails list',
        'Update or remove invalid email addresses',
        'Implement stricter validation on forms',
        'Monitor bounce rates regularly'
      ]
    });

  } catch (error) {
    console.error('❌ Email cleanup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform email cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
