import { NextResponse, NextRequest } from 'next/server';
import { requireRole } from '@/lib/api/guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const user = await requireRole(request, 'driver');

  const userId = user.id;

  try {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Get all incidents for the driver
    const incidents = await prisma.driverIncident.findMany({
      where: {
        driverId: driver.id,
      },
      include: {
        Assignment: {
          include: {
            Booking: {
              select: {
                reference: true,
                pickupAddress: true,
                dropoffAddress: true,
                scheduledAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      incidents: incidents.map(incident => ({
        id: incident.id,
        type: incident.type,
        severity: incident.severity,
        title: incident.title,
        description: incident.description,
        location: incident.location,
        photoUrls: incident.photoUrls,
        status: incident.status,
        reportedAt: incident.reportedAt,
        reviewedAt: incident.reviewedAt,
        reviewNotes: incident.reviewNotes,
        resolution: incident.resolution,
        customerImpact: incident.customerImpact,
        propertyDamage: incident.propertyDamage,
        injuryInvolved: incident.injuryInvolved,
        job: incident.Assignment
          ? {
              reference: incident.Assignment.Booking.reference,
              pickupAddress: incident.Assignment.Booking.pickupAddress,
              dropoffAddress: incident.Assignment.Booking.dropoffAddress,
              date: incident.Assignment.Booking.scheduledAt,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('Incidents GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
    const user = await requireRole(request, 'driver');

  const userId = user.id;

  try {
    const body = await request.json();
    const {
      type,
      severity,
      title,
      description,
      location,
      lat,
      lng,
      photoUrls,
      assignmentId,
      customerImpact,
      propertyDamage,
      injuryInvolved,
    } = body;

    // Validate required fields
    if (!type || !severity || !title || !description) {
      return NextResponse.json(
        {
          error: 'Missing required fields: type, severity, title, description',
        },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Validate assignmentId if provided
    if (assignmentId) {
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          driverId: driver.id,
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: 'Invalid assignment ID' },
          { status: 400 }
        );
      }
    }

    // Create incident
    const incident = await prisma.driverIncident.create({
      data: {
        driverId: driver.id,
        assignmentId: assignmentId || null,
        type,
        severity,
        title,
        description,
        location: location || null,
        lat: lat || null,
        lng: lng || null,
        photoUrls: photoUrls || [],
        customerImpact: customerImpact || false,
        propertyDamage: propertyDamage || false,
        injuryInvolved: injuryInvolved || false,
      },
      include: {
        Assignment: {
          include: {
            Booking: {
              select: {
                reference: true,
                pickupAddress: true,
                dropoffAddress: true,
              },
            },
          },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        actorId: driver.id,
        actorRole: 'driver',
        action: 'incident_reported',
        targetType: 'DriverIncident',
        targetId: incident.id,
        after: {
          type,
          severity,
          title,
          assignmentId,
        },
      },
    });

    return NextResponse.json(
      {
        incident: {
          id: incident.id,
          type: incident.type,
          severity: incident.severity,
          title: incident.title,
          status: incident.status,
          reportedAt: incident.reportedAt,
          job: incident.Assignment
            ? {
                reference: incident.Assignment.Booking.reference,
                pickupAddress: incident.Assignment.Booking.pickupAddress,
                dropoffAddress: incident.Assignment.Booking.dropoffAddress,
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Incidents POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

