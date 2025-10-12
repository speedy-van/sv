import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get recipients list for SMS sending
 * Supports: drivers, customers, admins
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'driver';

    let recipients: Array<{ id: string; name: string; phone: string; type: string }> = [];

    switch (type) {
      case 'driver':
        // Get all drivers with phone numbers from DriverProfile
        const drivers = await prisma.driver.findMany({
          where: {
            DriverProfile: {
              phone: { not: null },
            },
          },
          select: {
            id: true,
            userId: true,
            User: {
              select: {
                name: true,
                email: true,
              },
            },
            DriverProfile: {
              select: {
                phone: true,
              },
            },
          },
          take: 100,
        });

        recipients = drivers
          .filter(d => d.DriverProfile?.phone)
          .map(d => ({
            id: d.userId,
            name: d.User.name || d.User.email,
            phone: d.DriverProfile!.phone!,
            type: 'driver',
          }));
        break;

      case 'customer':
        // Get customers with phone numbers from recent bookings
        const bookings = await prisma.booking.findMany({
          where: {
            customerId: { not: null },
            customerPhone: { not: null },
          },
          select: {
            customerId: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
          },
          distinct: ['customerId'],
          take: 100,
          orderBy: {
            createdAt: 'desc',
          },
        });

        recipients = bookings
          .filter(b => b.customerPhone && b.customerId)
          .map(b => ({
            id: b.customerId!,
            name: b.customerName || b.customerEmail,
            phone: b.customerPhone,
            type: 'customer',
          }));
        break;

      case 'admin':
        // For admins, return a placeholder since they typically don't have phone in DB
        // Admin numbers should be entered manually
        recipients = [];
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid recipient type' },
          { status: 400 }
        );
    }

    console.log(`Loaded ${recipients.length} ${type}s with phone numbers`);

    return NextResponse.json({
      success: true,
      recipients,
      count: recipients.length,
      type,
    });
  } catch (error) {
    console.error('Error loading recipients:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to load recipients',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

