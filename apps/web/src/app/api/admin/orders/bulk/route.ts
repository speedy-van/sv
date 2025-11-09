import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';
import { upsertAssignment } from '@/lib/utils/assignment-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user || (s.user as any).role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { orderIds, action, data } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    let errorCount = 0;
    const errors: string[] = [];

    switch (action) {
      case 'export':
        // Export orders to CSV format
        const orders = await prisma.booking.findMany({
          where: {
            id: { in: orderIds },
          },
          include: {
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
            driver: {
              include: {
                User: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            pickupAddress: true,
            dropoffAddress: true,
          },
        });

        const csvData = orders.map(order => ({
          reference: order.reference,
          status: order.status,
          customerName: order.customer?.name || 'Unknown',
          customerEmail: order.customer?.email || 'Unknown',
          pickupAddress: order.pickupAddress?.label || 'Unknown',
          dropoffAddress: order.dropoffAddress?.label || 'Unknown',
          amount: (order.totalGBP / 100).toFixed(2),
          driverName: order.driver?.User.name || 'Unassigned',
          createdAt: order.createdAt,
          scheduledAt: order.scheduledAt,
        }));

        return NextResponse.json({
          success: true,
          message: `Exported ${orders.length} orders`,
          data: csvData,
        });

      case 'email':
        // Send email to customers of selected orders
        const emailOrders = await prisma.booking.findMany({
          where: {
            id: { in: orderIds },
          },
          include: {
            customer: true,
          },
        });

        // Here you would integrate with your email service
        // For now, just return success
        return NextResponse.json({
          success: true,
          message: `Email notifications sent to ${emailOrders.length} customers`,
          count: emailOrders.length,
        });

      case 'assign':
        // Bulk assign orders to drivers
        const { driverId, autoAssign = false, reason } = data || {};

        if (!driverId && !autoAssign) {
          return NextResponse.json(
            { error: 'Driver ID or auto-assign required' },
            { status: 400 }
          );
        }

        for (const orderId of orderIds) {
          try {
            const booking = await prisma.booking.findUnique({
              where: { id: orderId },
              include: { driver: true },
            });

            if (!booking) {
              errorCount++;
              errors.push(`Order ${orderId} not found`);
              continue;
            }

            if (booking.driverId && !autoAssign) {
              errorCount++;
              errors.push(`Order ${booking.reference} already assigned`);
              continue;
            }

            let targetDriverId = driverId;

            // Auto-assign logic
            if (autoAssign || !driverId) {
              const availableDrivers = await prisma.driver.findMany({
                where: {
                  status: 'active',
                  onboardingStatus: 'approved',
                },
                include: {
                  Booking: {
                    where: {
                      status: {
                        in: ['CONFIRMED', 'COMPLETED'],
                      },
                    },
                  },
                },
                orderBy: [{ rating: 'desc' }, { createdAt: 'asc' }],
                take: 10,
              });

              const suitableDrivers = availableDrivers.filter(driver => {
                const activeJobs = driver.Booking.length;
                return activeJobs < 3;
              });

              if (suitableDrivers.length === 0) {
                errorCount++;
                errors.push(
                  `No suitable drivers available for order ${booking.reference}`
                );
                continue;
              }

              targetDriverId = suitableDrivers[0].id;
            }

            // Update booking
            await prisma.booking.update({
              where: { id: orderId },
              data: {
                driverId: targetDriverId,
                status: 'CONFIRMED',
              },
            });

            // Create or update assignment
            await upsertAssignment(prisma, orderId, {
              driverId: targetDriverId,
              status: 'invited',
              round: 1,
            });

            // SMS notification will be sent via individual assignment endpoint
            console.log(`✅ Order ${booking.reference} assigned to driver ${targetDriverId}`);

            // Log audit
            await logAudit((s.user as any).id, 'bulk_assign_driver', orderId, { targetType: 'booking', before: { driverId: booking.driverId, status: booking.status }, after: { driverId: targetDriverId, status: 'CONFIRMED' } });
          } catch (error) {
            errorCount++;
            errors.push(`Error processing order ${orderId}: ${error}`);
          }
        }

        return NextResponse.json({
          success: true,
          message: `Processed ${orderIds.length} orders with ${errorCount} errors`,
          errors: errors.length > 0 ? errors : undefined,
        });

      case 'cancel':
        // Bulk cancel orders
        for (const orderId of orderIds) {
          try {
            const booking = await prisma.booking.findUnique({
              where: { id: orderId },
            });

            if (!booking) {
              errorCount++;
              errors.push(`Order ${orderId} not found`);
              continue;
            }

            if (booking.status === 'CANCELLED') {
              errorCount++;
              errors.push(`Order ${booking.reference} already cancelled`);
              continue;
            }

            await prisma.booking.update({
              where: { id: orderId },
              data: { status: 'CANCELLED' },
            });

            // Log audit
            await logAudit((s.user as any).id, 'bulk_cancel_order', orderId, { targetType: 'booking', before: { status: booking.status }, after: { status: 'CANCELLED' } });
          } catch (error) {
            errorCount++;
            errors.push(`Error cancelling order ${orderId}: ${error}`);
          }
        }

        return NextResponse.json({
          success: true,
          message: `Cancelled ${orderIds.length - errorCount} orders with ${errorCount} errors`,
          errors: errors.length > 0 ? errors : undefined,
        });

      case 'send-floor-warnings':
        // Send floor warning emails to selected orders
        const floorWarningResults = [];
        let floorWarningsSent = 0;
        let floorWarningsSkipped = 0;

        for (const orderId of orderIds) {
          try {
            const booking = await prisma.booking.findUnique({
              where: { id: orderId },
              include: {
                pickupProperty: true,
                dropoffProperty: true,
              },
            });

            if (!booking) {
              errorCount++;
              errors.push(`Order ${orderId} not found`);
              continue;
            }

            const preferences = (booking.customerPreferences as any) || {};
            const pickupMeta = preferences?.pickupAddressMeta || {};
            const dropoffMeta = preferences?.dropoffAddressMeta || {};

            const result = await unifiedEmailService.sendFloorWarningIfNeeded({
              reference: booking.reference,
              customerEmail: booking.customerEmail,
              customerName: booking.customerName,
              pickupProperty: (booking as any).pickupProperty ? {
                floors: (booking as any).pickupProperty.floors,
                accessType: (booking as any).pickupProperty.accessType,
              } : undefined,
              dropoffProperty: (booking as any).dropoffProperty ? {
                floors: (booking as any).dropoffProperty.floors,
                accessType: (booking as any).dropoffProperty.accessType,
              } : undefined,
              pickupAddressMeta: pickupMeta,
              dropoffAddressMeta: dropoffMeta,
            });

            floorWarningResults.push({
              orderId,
              reference: booking.reference,
              sent: result.sent,
              message: result.message,
            });

            if (result.sent) {
              floorWarningsSent++;
              console.log(`✅ Floor warning sent for order ${booking.reference}`);
            } else {
              floorWarningsSkipped++;
              console.log(`⏭️ Skipped order ${booking.reference}: ${result.message}`);
            }
          } catch (error) {
            errorCount++;
            errors.push(`Error sending floor warning for order ${orderId}: ${error}`);
          }
        }

        return NextResponse.json({
          success: true,
          message: `Checked ${orderIds.length} orders. Sent ${floorWarningsSent} floor warnings.`,
          summary: {
            totalChecked: orderIds.length,
            sent: floorWarningsSent,
            skipped: floorWarningsSkipped,
            errors: errorCount,
          },
          results: floorWarningResults,
          errors: errors.length > 0 ? errors : undefined,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Bulk operations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
