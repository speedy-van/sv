import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/admin/orders/auto-notify-drivers - Auto notify available drivers about unassigned orders
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🚀 Auto-notifying drivers about unassigned orders...');

    // Get unassigned orders older than 10 minutes
    const unassignedOrders = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        driverId: null,
        createdAt: {
          lte: new Date(Date.now() - 10 * 60 * 1000) // Older than 10 minutes
        }
      },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        items: true,
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 5 // Limit to 5 orders at a time
    });

    if (unassignedOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unassigned orders found',
        ordersProcessed: 0
      });
    }

    console.log(`📢 Processing ${unassignedOrders.length} unassigned orders for driver notifications`);

    const results = [];

    // Process each order
    for (const order of unassignedOrders) {
      try {
        // Call the existing notify-drivers endpoint
        const notifyResponse = await fetch(`${request.nextUrl.origin}/api/admin/notify-drivers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            bookingId: order.id
          })
        });

        const notifyResult = await notifyResponse.json();
        
        if (notifyResponse.ok) {
          results.push({
            orderId: order.id,
            orderReference: order.reference,
            success: true,
            driversNotified: notifyResult.driversNotified || 0,
            message: `Successfully notified drivers about order ${order.reference}`
          });
          
          console.log(`✅ Notified drivers about order ${order.reference} (${notifyResult.driversNotified || 0} drivers)`);
        } else {
          results.push({
            orderId: order.id,
            orderReference: order.reference,
            success: false,
            error: notifyResult.error || 'Unknown error',
            message: `Failed to notify drivers about order ${order.reference}`
          });
          
          console.error(`❌ Failed to notify drivers about order ${order.reference}:`, notifyResult.error);
        }

        // Small delay between notifications to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push({
          orderId: order.id,
          orderReference: order.reference,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: `Error processing notifications for order ${order.reference}`
        });
        
        console.error(`❌ Error processing order ${order.reference}:`, error);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${unassignedOrders.length} unassigned orders`,
      ordersProcessed: unassignedOrders.length,
      successfulNotifications: successCount,
      failedNotifications: failCount,
      results: results,
      summary: {
        totalOrders: unassignedOrders.length,
        successful: successCount,
        failed: failCount,
        driversNotified: results.reduce((sum, r) => sum + (r.driversNotified || 0), 0)
      }
    });

  } catch (error) {
    console.error('❌ Error in auto-notify-drivers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to auto-notify drivers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}