import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const incident = await prisma.driverIncident.findUnique({
      where: { id: params.id },
      include: {
        Driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                isActive: true
              }
            },
            DriverAvailability: true,
          },
        },
        Assignment: {
          include: {
            Booking: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    console.error('Get incident error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();

    const incident = await prisma.driverIncident.findUnique({
      where: { id: params.id },
    });

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    let updatedIncident;

    switch (action) {
      case 'resolve':
        updatedIncident = await prisma.driverIncident.update({
          where: { id: params.id },
          data: {
            status: 'resolved',
            reviewedAt: new Date(),
            reviewedBy: (session.user as any).id,
            reviewNotes: data.notes || null,
          },
          include: {
            Driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true
                  }
                },
              },
            },
            Assignment: {
              include: {
                Booking: true,
              },
            },
          },
        });

        // Log resolution
        await prisma.auditLog.create({
          data: {
            actorId: (session.user as any).id,
            actorRole: (session.user as any).role || 'admin',
            action: 'incident_resolved',
            targetType: 'driverIncident',
            targetId: params.id,
            before: undefined,
            after: {
              status: 'resolved',
              reviewNotes: data.notes,
            },
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });
        break;

      case 'escalate':
        updatedIncident = await prisma.driverIncident.update({
          where: { id: params.id },
          data: {
            status: 'escalated',
            reviewNotes: data.reason || null,
          },
          include: {
            Driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true
                  }
                },
              },
            },
            Assignment: {
              include: {
                Booking: true,
              },
            },
          },
        });

        // Log escalation
        await prisma.auditLog.create({
          data: {
            actorId: (session.user as any).id,
            actorRole: (session.user as any).role || 'admin',
            action: 'incident_escalated',
            targetType: 'driverIncident',
            targetId: params.id,
            before: undefined,
            after: {
              status: 'escalated',
              reviewNotes: data.reason,
            },
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });
        break;

      case 'update':
        updatedIncident = await prisma.driverIncident.update({
          where: { id: params.id },
          data: {
            ...data,
            updatedAt: new Date(),
          },
          include: {
            Driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true
                  }
                },
              },
            },
            Assignment: {
              include: {
                Booking: true,
              },
            },
          },
        });

        // Log update
        await prisma.auditLog.create({
          data: {
            actorId: (session.user as any).id,
            actorRole: (session.user as any).role || 'admin',
            action: 'incident_updated',
            targetType: 'driverIncident',
            targetId: params.id,
            before: undefined,
            after: data,
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });
        break;

      case 'add_note':
        const newNote = {
          text: data.note,
          author: (session.user as any).name,
          timestamp: new Date().toISOString(),
        };

        updatedIncident = await prisma.driverIncident.update({
          where: { id: params.id },
          data: {
            reviewNotes: data.note,
            updatedAt: new Date(),
          },
          include: {
            Driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true
                  }
                },
              },
            },
            Assignment: {
              include: {
                Booking: true,
              },
            },
          },
        });

        // Log note addition
        await prisma.auditLog.create({
          data: {
            actorId: (session.user as any).id,
            actorRole: (session.user as any).role || 'admin',
            action: 'incident_note_added',
            targetType: 'driverIncident',
            targetId: params.id,
            before: undefined,
            after: {
              note: data.note,
            },
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });
        break;

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Incident ${action} successful`,
      data: updatedIncident,
    });
  } catch (error) {
    console.error('Update incident error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const incident = await prisma.driverIncident.findUnique({
      where: { id: params.id },
    });

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    // Soft delete by marking as closed
    await prisma.driverIncident.update({
      where: { id: params.id },
      data: {
        status: 'closed',
      },
    });

    // Log deletion
    await prisma.auditLog.create({
      data: {
        actorId: (session.user as any).id,
        actorRole: (session.user as any).role || 'admin',
        action: 'incident_archived',
        targetType: 'driverIncident',
        targetId: params.id,
        before: undefined,
        after: {
          status: 'closed',
        },
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Incident archived successfully',
    });
  } catch (error) {
    console.error('Delete incident error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
