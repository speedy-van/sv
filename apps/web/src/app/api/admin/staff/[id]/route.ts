import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, assertHasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  employeeId: z.string().min(1).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'intern']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'terminated', 'on_leave']).optional(),
  workSchedule: z.object({
    defaultShift: z.object({
      start: z.string(),
      end: z.string(),
    }),
    weeklyOverrides: z.record(z.object({
      start: z.string(),
      end: z.string(),
    })).optional(),
    breakMinutes: z.number().default(60),
    minHours: z.number().default(8),
  }).optional(),
});

// GET /api/admin/staff/:id - Get single staff
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    try {
      assertHasRole(session, ['admin']);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
        Attendance: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        Leaves: {
          take: 10,
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/staff/:id - Update staff
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    try {
      assertHasRole(session, ['admin']);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateStaffSchema.parse(body);

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id: params.id },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Check employee ID uniqueness if being updated
    if (data.employeeId && data.employeeId !== existingStaff.employeeId) {
      const duplicate = await prisma.staff.findUnique({
        where: { employeeId: data.employeeId },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Employee ID already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.department !== undefined) updateData.department = data.department;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.workSchedule !== undefined) updateData.workSchedule = data.workSchedule;

    // Update staff
    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: updateData,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Update user if name or phone changed
    if (data.name !== undefined || data.phone !== undefined) {
      const userUpdate: any = {};
      if (data.name !== undefined) userUpdate.name = data.name;
      if (data.phone !== undefined) userUpdate.phone = data.phone;

      await prisma.user.update({
        where: { id: staff.userId },
        data: userUpdate,
      });
    }

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error('Update staff error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/staff/:id - Delete staff
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    try {
      assertHasRole(session, ['admin']);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Check if staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Delete staff (cascade will delete user)
    await prisma.staff.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

