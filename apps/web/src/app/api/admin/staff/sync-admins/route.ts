import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

function pad(num: number, size = 4): string {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

async function generateEmployeeId(): Promise<string> {
  // Generate sequential ADM-XXXX based on count of existing staff with ADM- prefix
  const count = await prisma.staff.count({
    where: { employeeId: { startsWith: 'ADM-' } },
  });
  return `ADM-${pad(count + 1)}`;
}

export async function POST(_request: NextRequest) {
  try {
    const authResult = await requireAdmin(_request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Find all active admin users
    const admins = await prisma.user.findMany({
      where: { role: 'admin', isActive: true },
      select: { id: true, email: true, name: true, phone: true, adminRole: true },
      orderBy: { createdAt: 'asc' },
    });

    if (admins.length === 0) {
      return NextResponse.json({ success: true, created: 0, skipped: 0 });
    }

    let created = 0;
    let skipped = 0;

    const mapRole = (adminRole?: string | null): { department: string; position: string } => {
      switch ((adminRole || '').toLowerCase()) {
        case 'superadmin':
          return { department: 'Administration', position: 'Super Admin' };
        case 'ops':
          return { department: 'Operations', position: 'Operations Admin' };
        case 'support':
          return { department: 'Support', position: 'Support Admin' };
        case 'reviewer':
          return { department: 'Compliance', position: 'Reviewer Admin' };
        case 'finance':
          return { department: 'Finance', position: 'Finance Admin' };
        case 'read_only':
        default:
          return { department: 'Administration', position: 'Admin' };
      }
    };

    for (const admin of admins) {
      const exists = await prisma.staff.findFirst({
        where: { userId: admin.id },
        select: { id: true },
      });

      if (exists) {
        skipped += 1;
        continue;
      }

      const employeeId = await generateEmployeeId();
      const roleMap = mapRole((admin as any).adminRole);

      await prisma.staff.create({
        data: {
          userId: admin.id,
          employeeId,
          department: roleMap.department,
          position: roleMap.position,
          employmentType: 'full_time',
          status: 'active',
          hireDate: new Date(),
          workSchedule: {
            defaultShift: { start: '09:00', end: '17:00' },
            breakMinutes: 60,
            minHours: 8,
            weeklyOverrides: {},
          },
        },
      });
      created += 1;
    }

    return NextResponse.json({ success: true, created, skipped });
  } catch (error) {
    console.error('Sync admins to staff error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


