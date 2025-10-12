import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/admin/drivers/applications/[id]/request_info - Request additional information
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { id } = params;
    const body = await request.json();
    const { rejectionReason } = body;

    // Update application status
    const updatedApplication = await prisma.driverApplication.update({
      where: { id },
      data: {
        status: 'requires_additional_info',
        reviewNotes: rejectionReason || 'Additional information required',
        reviewedAt: new Date(),
        reviewedBy: user.name || user.email,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create notification for the driver
    if (updatedApplication.userId) {
      // Find the Driver record associated with this User
      const driverRecord = await prisma.driver.findUnique({
        where: { userId: updatedApplication.userId },
        select: { id: true },
      });

      if (driverRecord) {
        await prisma.driverNotification.create({
          data: {
            driverId: driverRecord.id,
            type: 'system_alert',
            title: 'Additional Information Required',
            message: `We need additional information for your driver application. Details: ${rejectionReason || 'Additional information required'}`,
            read: false,
          },
        });
        console.log('🔧 [REQUEST_INFO DEBUG] Driver notification created for driverId:', driverRecord.id);
      } else {
        console.log('🔧 [REQUEST_INFO DEBUG] No driver record found for userId:', updatedApplication.userId);
        // For pending applications, driver record may not exist yet
      }
    }

    return NextResponse.json({
      message: 'Additional information requested successfully',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Driver application request info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}