import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

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

    const driverId = params.id;
    const { action, reviewNotes, documentId } = await request.json();

    if (!action || !['approve', 'reject', 'request_changes'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
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
        Document: true,
        DriverChecks: true,
        DriverVehicle: true,
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    let updateData: any = {};
    let documentUpdateData: any = {};

    switch (action) {
      case 'approve':
        updateData = {
          onboardingStatus: 'approved',
          approvedAt: new Date(),
        };

        if (documentId) {
          documentUpdateData = {
            status: 'verified',
            verifiedAt: new Date(),
            verifiedBy: user.id,
          };
        }
        break;

      case 'reject':
        updateData = {
          onboardingStatus: 'suspended',
        };

        if (documentId) {
          documentUpdateData = {
            status: 'rejected',
            verifiedAt: new Date(),
            verifiedBy: user.id,
          };
        }
        break;

      case 'request_changes':
        updateData = {
          onboardingStatus: 'docs_pending',
        };
        break;
    }

    // Update driver status
    if (Object.keys(updateData).length > 0) {
      await prisma.driver.update({
        where: { id: driverId },
        data: updateData,
      });
    }

    // Update specific document if provided
    if (documentId && Object.keys(documentUpdateData).length > 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: documentUpdateData,
      });
    }

    // Log the review action
    await logAudit(user.id, `driver_${action}`, driverId, { targetType: 'driver', before: { onboardingStatus: driver.onboardingStatus, documents: driver.Document.map(d => ({ id: d.id, status: d.status })) }, after: { onboardingStatus: updateData.onboardingStatus || driver.onboardingStatus, reviewNotes, documentId, reviewedBy: user.id } });

    return NextResponse.json({
      success: true,
      message: `Driver ${action}d successfully`,
      driver: {
        id: driver.id,
        onboardingStatus:
          updateData.onboardingStatus || driver.onboardingStatus,
        approvedAt: updateData.approvedAt || driver.approvedAt,
      },
    });
  } catch (error) {
    console.error('Driver review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const driverId = params.id;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
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
        Document: {
          orderBy: { uploadedAt: 'desc' },
        },
        DriverChecks: true,
        DriverVehicle: true,
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Check compliance status
    const complianceStatus = {
      personalInfo: !!driver.User.name && !!driver.basePostcode,
      vehicle: driver.DriverVehicle.length > 0,
      license: !!driver.DriverChecks?.licenceCategories?.length,
      insurance: !!driver.DriverChecks?.insurancePolicyNo && !!driver.DriverChecks?.insurer,
      rtw: !!driver.DriverChecks?.rtwMethod,
      dbs: !!driver.DriverChecks?.dbsType,
      documents: {
        rtw: driver.Document.some(
          d => d.category === 'rtw' && d.status === 'verified'
        ),
        licence: driver.Document.some(
          d => d.category === 'licence' && d.status === 'verified'
        ),
        insurance: driver.Document.some(
          d => d.category === 'insurance' && d.status === 'verified'
        ),
        mot: driver.Document.some(
          d => d.category === 'mot' && d.status === 'verified'
        ),
        v5c: driver.Document.some(
          d => d.category === 'v5c' && d.status === 'verified'
        ),
        dbs: driver.Document.some(
          d => d.category === 'dbs' && d.status === 'verified'
        ),
      },
    };

    const allRequiredDocumentsVerified = Object.values(
      complianceStatus.documents
    ).every(Boolean);
    const allInfoComplete = Object.values(complianceStatus).every(Boolean);

    return NextResponse.json({
      driver: {
        id: driver.id,
        name: driver.User.name,
        email: driver.User.email,
        onboardingStatus: driver.onboardingStatus,
        approvedAt: driver.approvedAt,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
      },
      compliance: {
        ...complianceStatus,
        allRequiredDocumentsVerified,
        allInfoComplete,
        canApprove:
          allInfoComplete &&
          allRequiredDocumentsVerified &&
          driver.onboardingStatus === 'in_review',
      },
      documents: driver.Document,
      checks: driver.DriverChecks,
      vehicles: driver.DriverVehicle,
    });
  } catch (error) {
    console.error('Driver review GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
