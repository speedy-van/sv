/**
 * API Endpoint: Get full journey opportunity details
 * 
 * This endpoint allows admin to retrieve complete details of a journey opportunity
 * including all booking information, customer details, items, pricing, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== Role.admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const journeyOpportunityId = params.id;

    // Fetch complete journey opportunity details
    const journeyOpportunity = await prisma.journeyOpportunity.findUnique({
      where: { id: journeyOpportunityId },
    });

    if (!journeyOpportunity) {
      return NextResponse.json(
        { error: 'Journey opportunity not found' },
        { status: 404 }
      );
    }

    // If linked to a booking, fetch booking details
    let bookingDetails = null;
    if (journeyOpportunity.bookingId) {
      bookingDetails = await prisma.booking.findUnique({
        where: { id: journeyOpportunity.bookingId },
        include: {
          BookingItem: true,
          BookingSegment: {
            include: {
              pickupAddress: true,
              dropoffAddress: true,
            },
          },
          pickupAddress: true,
          dropoffAddress: true,
          pickupProperty: true,
          dropoffProperty: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });
    }

    // Mark as viewed by this admin
    const viewedBy = journeyOpportunity.viewedBy || [];
    if (!viewedBy.includes(session.user.id)) {
      await prisma.journeyOpportunity.update({
        where: { id: journeyOpportunityId },
        data: {
          viewedBy: [...viewedBy, session.user.id],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        journeyOpportunity,
        bookingDetails,
      },
    });

  } catch (error) {
    console.error('❌ Error fetching journey opportunity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update journey opportunity
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== Role.admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const journeyOpportunityId = params.id;
    const body = await request.json();

    // Check if opportunity exists
    const existing = await prisma.journeyOpportunity.findUnique({
      where: { id: journeyOpportunityId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Journey opportunity not found' },
        { status: 404 }
      );
    }

    // Prepare update data (only allow updating specific fields)
    const updateData: any = {};

    // Customer information
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail;
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone;

    // Journey details
    if (body.pickupAddress !== undefined) updateData.pickupAddress = body.pickupAddress;
    if (body.pickupPostcode !== undefined) updateData.pickupPostcode = body.pickupPostcode;
    if (body.pickupCity !== undefined) updateData.pickupCity = body.pickupCity;
    if (body.pickupLat !== undefined) updateData.pickupLat = body.pickupLat;
    if (body.pickupLng !== undefined) updateData.pickupLng = body.pickupLng;
    if (body.dropoffAddress !== undefined) updateData.dropoffAddress = body.dropoffAddress;
    if (body.dropoffPostcode !== undefined) updateData.dropoffPostcode = body.dropoffPostcode;
    if (body.dropoffCity !== undefined) updateData.dropoffCity = body.dropoffCity;
    if (body.dropoffLat !== undefined) updateData.dropoffLat = body.dropoffLat;
    if (body.dropoffLng !== undefined) updateData.dropoffLng = body.dropoffLng;

    // Pricing details
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice;
    if (body.basePrice !== undefined) updateData.basePrice = body.basePrice;
    if (body.distanceMiles !== undefined) updateData.distanceMiles = body.distanceMiles;
    if (body.itemsCount !== undefined) updateData.itemsCount = body.itemsCount;
    if (body.crewSize !== undefined) updateData.crewSize = body.crewSize;
    if (body.serviceLevel !== undefined) updateData.serviceLevel = body.serviceLevel;

    // Return journey specific
    if (body.discount !== undefined) updateData.discount = body.discount;
    if (body.discountPercentage !== undefined) updateData.discountPercentage = body.discountPercentage;
    if (body.driverEarnings !== undefined) updateData.driverEarnings = body.driverEarnings;
    if (body.matchScore !== undefined) updateData.matchScore = body.matchScore;

    // Multi-drop
    if (body.multiDropPotential !== undefined) updateData.multiDropPotential = body.multiDropPotential;
    if (body.potentialSavings !== undefined) updateData.potentialSavings = body.potentialSavings;

    // Items
    if (body.items !== undefined) updateData.items = body.items;

    // Scheduling
    if (body.scheduledDate !== undefined) {
      updateData.scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null;
    }
    if (body.estimatedDuration !== undefined) updateData.estimatedDuration = body.estimatedDuration;

    // Status
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'claimed') {
        updateData.claimedBy = session.user.id;
        updateData.claimedAt = new Date();
      }
      if (body.status === 'converted' && body.convertedToBookingId) {
        updateData.convertedToBookingId = body.convertedToBookingId;
        updateData.convertedAt = new Date();
      }
    }

    // Notes
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Update the opportunity
    const updated = await prisma.journeyOpportunity.update({
      where: { id: journeyOpportunityId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Journey opportunity updated successfully',
      data: updated,
    });

  } catch (error) {
    console.error('❌ Error updating journey opportunity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete journey opportunity
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== Role.admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const journeyOpportunityId = params.id;

    // Check if opportunity exists
    const existing = await prisma.journeyOpportunity.findUnique({
      where: { id: journeyOpportunityId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Journey opportunity not found' },
        { status: 404 }
      );
    }

    // Delete the opportunity
    await prisma.journeyOpportunity.delete({
      where: { id: journeyOpportunityId },
    });

    return NextResponse.json({
      success: true,
      message: 'Journey opportunity deleted successfully',
    });

  } catch (error) {
    console.error('❌ Error deleting journey opportunity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

