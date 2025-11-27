import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUser = authResult;

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

    // Log the incident creation for audit
    await prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        actorRole: adminUser.role || 'admin',
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
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
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
    const assignment = await prisma.assignment.findFirst({
      where: { bookingId: jobId },
      orderBy: { createdAt: 'desc' }
    });
    return assignment?.id || null;
  } catch {
    return null;
  }
}
