import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { code } = await params;

    // Fetch order
    const order = await prisma.booking.findUnique({
      where: { reference: code },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch audit logs for this order
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetType: 'booking',
        targetId: order.id,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch communication logs
    const communicationLogs = await prisma.communicationLog.findMany({
      where: {
        bookingId: order.id,
      },
      orderBy: {
        attemptedAt: 'desc',
      },
    });

    // Fetch assignment history
    const assignments = await prisma.assignment.findMany({
      where: {
        bookingId: order.id,
      },
      include: {
        Driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch job events
    const jobEvents = await prisma.jobEvent.findMany({
      where: {
        Assignment: {
          bookingId: order.id,
        },
      },
      include: {
        Assignment: {
          include: {
            Driver: {
              include: {
                User: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform all events into timeline format
    const timelineEvents = [];

    // Add order creation event
    const orderDetails = await prisma.booking.findUnique({
      where: { id: order.id },
      select: { createdAt: true, status: true },
    });

    if (orderDetails) {
      timelineEvents.push({
        id: `created-${order.id}`,
        type: 'created',
        timestamp: orderDetails.createdAt.toISOString(),
        user: { name: 'System', email: 'system@speedy-van.co.uk' },
        details: 'Order created',
        metadata: {
          status: orderDetails.status,
        },
      });
    }

    // Add audit log events
    auditLogs.forEach((log) => {
      timelineEvents.push({
        id: log.id,
        type: mapAuditActionToEventType(log.action),
        timestamp: log.createdAt.toISOString(),
        user: log.User
          ? {
              name: log.User.name || 'Unknown',
              email: log.User.email || '',
            }
          : {
              name: log.actorRole || 'System',
              email: '',
            },
        details: formatAuditDetails(log),
        metadata: {
          action: log.action,
          before: log.before,
          after: log.after,
          details: log.details,
        },
      });
    });

    // Add communication events
    communicationLogs.forEach((comm) => {
      timelineEvents.push({
        id: `comm-${comm.id}`,
        type: 'communication',
        timestamp: comm.attemptedAt.toISOString(),
        user: { name: 'System', email: 'system@speedy-van.co.uk' },
        details: formatCommunicationDetails(comm),
        metadata: {
          channel: comm.channel,
          recipient: comm.recipient,
          status: comm.status,
          type: comm.type,
        },
      });
    });

    // Add assignment events
    assignments.forEach((assignment) => {
      timelineEvents.push({
        id: `assign-${assignment.id}`,
        type: 'assigned',
        timestamp: assignment.createdAt.toISOString(),
        user: assignment.Driver?.User
          ? {
              name: assignment.Driver.User.name || 'Unknown Driver',
              email: assignment.Driver.User.email || '',
            }
          : { name: 'System', email: 'system@speedy-van.co.uk' },
        details: formatAssignmentDetails(assignment),
        metadata: {
          status: assignment.status,
          claimedAt: assignment.claimedAt?.toISOString(),
          driverName: assignment.Driver?.User?.name,
        },
      });
    });

    // Add job events
    jobEvents.forEach((event) => {
      timelineEvents.push({
        id: `job-${event.id}`,
        type: 'job_event',
        timestamp: event.createdAt.toISOString(),
        user: event.Assignment?.Driver?.User
          ? {
              name: event.Assignment.Driver.User.name || 'Unknown Driver',
              email: '',
            }
          : { name: 'System', email: 'system@speedy-van.co.uk' },
        details: formatJobEventDetails(event),
        metadata: {
          step: event.step,
          assignmentId: event.assignmentId,
        },
      });
    });

    // Sort by timestamp (newest first)
    timelineEvents.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({
      success: true,
      events: timelineEvents,
      total: timelineEvents.length,
    });
  } catch (error) {
    console.error('❌ Error fetching order timeline:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch order timeline',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function mapAuditActionToEventType(action: string): string {
  if (action.includes('assign')) return 'assigned';
  if (action.includes('cancel')) return 'cancelled';
  if (action.includes('update')) return 'updated';
  if (action.includes('payment')) return 'payment';
  if (action.includes('refund')) return 'refund';
  if (action.includes('email') || action.includes('send')) return 'communication';
  return 'other';
}

function formatAuditDetails(log: any): string {
  const action = log.action;
  if (action.includes('assign')) {
    return `Driver assigned${log.after?.driverName ? `: ${log.after.driverName}` : ''}`;
  }
  if (action.includes('cancel')) {
    return `Order cancelled${log.after?.reason ? `: ${log.after.reason}` : ''}`;
  }
  if (action.includes('update')) {
    return 'Order details updated';
  }
  if (action.includes('payment')) {
    return `Payment ${action.includes('confirm') ? 'confirmed' : 'processed'}`;
  }
  if (action.includes('refund')) {
    return `Refund issued: £${((log.after?.amount || 0) / 100).toFixed(2)}`;
  }
  return action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function formatCommunicationDetails(comm: any): string {
  const type = comm.type.toLowerCase();
  const channel = comm.channel.toLowerCase();
  const status = comm.status.toLowerCase();
  
  if (type === 'email') {
    return `Email ${status === 'sent' ? 'sent' : status} to ${comm.recipient}`;
  }
  if (type === 'sms') {
    return `SMS ${status === 'sent' ? 'sent' : status} to ${comm.recipient}`;
  }
  return `${channel} ${status} to ${comm.recipient}`;
}

function formatAssignmentDetails(assignment: any): string {
  const driverName = assignment.Driver?.User?.name || 'Unknown Driver';
  const status = assignment.status;
  
  if (status === 'claimed') {
    return `Assigned to ${driverName} (claimed)`;
  }
  if (status === 'declined') {
    return `Assignment declined by ${driverName}`;
  }
  return `Assigned to ${driverName} (${status})`;
}

function formatJobEventDetails(event: any): string {
  const eventType = event.eventType?.toLowerCase() || '';
  const driverName = event.Assignment?.Driver?.User?.name || 'Driver';
  
  if (eventType.includes('pickup')) {
    return `${driverName} arrived at pickup location`;
  }
  if (eventType.includes('dropoff')) {
    return `${driverName} completed dropoff`;
  }
  if (eventType.includes('start')) {
    return `${driverName} started job`;
  }
  if (eventType.includes('complete')) {
    return `${driverName} completed job`;
  }
  return `${driverName}: ${eventType}`;
}

