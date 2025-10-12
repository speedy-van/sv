import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, description, severity, driverId, jobId } =
      await request.json();

    if (!category || !description || !severity) {
      return NextResponse.json(
        {
          error: 'Category, description, and severity are required',
        },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        {
          error: 'Invalid severity level',
        },
        { status: 400 }
      );
    }

    // Create the incident
    const incident = await prisma.driverIncident.create({
      data: {
        driverId: driverId || null,
        assignmentId: jobId ? await getAssignmentId(jobId) : null,
        type: category,
        title: category,
        description,
        severity,
        status: 'reported',
      },
      include: {
        driver: {
          include: {
            user: {
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

    // Log the incident creation for audit
    await prisma.auditLog.create({
      data: {
        actorId: (session.user as any).id,
        actorRole: (session.user as any).role || 'admin',
        action: 'incident_created',
        targetType: 'driverIncident',
        targetId: incident.id,
        before: undefined,
        after: {
          type: category,
          severity,
          status: 'reported',
        },
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Incident created successfully',
      data: incident,
    });
  } catch (error) {
    console.error('Create incident error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const driverId = searchParams.get('driverId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (status) where.status = status;
    if (driverId) where.driverId = driverId;

    const incidents = await prisma.driverIncident.findMany({
      where,
      include: {
        driver: {
          include: {
            user: {
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getAssignmentId(jobId: string): Promise<string | null> {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { bookingId: jobId },
    });
    return assignment?.id || null;
  } catch {
    return null;
  }
}
