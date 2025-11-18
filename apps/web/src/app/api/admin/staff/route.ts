import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  employeeId: z.string().min(1),
  department: z.string().optional(),
  position: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'intern']).optional(),
  password: z.string().min(6),
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

// GET /api/admin/staff - List all staff
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user as { role?: string } | undefined;

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (department && department.trim()) {
      where.department = department;
    }

    if (status && status.trim()) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { User: { name: { contains: search, mode: 'insensitive' } } },
        { User: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              role: true,
              adminRole: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.staff.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      staff,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/staff - Create new staff
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user as { role?: string } | undefined;

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const data = createStaffSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if employee ID already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { employeeId: data.employeeId },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user and staff
    const createdUser = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        role: 'staff',
        emailVerified: true,
      },
    });

    const staff = await prisma.staff.create({
      data: {
        userId: createdUser.id,
        employeeId: data.employeeId,
        department: data.department,
        position: data.position,
        employmentType: data.employmentType || 'full_time',
        workSchedule: data.workSchedule || {
          defaultShift: { start: '09:00', end: '17:00' },
          breakMinutes: 60,
          minHours: 8,
        },
        hireDate: new Date(),
      },
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

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error('Create staff error:', error);

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

