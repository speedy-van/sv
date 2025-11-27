import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/audit-logs/export
 * Export audit logs as CSV or JSON
 */
export async function GET(request: NextRequest) {
  try {
    // Try custom session first
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin';
    let isSuperAdmin = customSession?.user?.adminRole === 'superadmin';
    
    if (!customSession?.user) {
      // Fallback to NextAuth
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, adminRole: true },
      });
      
      isAdmin = user?.role === 'admin';
      isSuperAdmin = user?.adminRole === 'superadmin';
      
      if (!user || (!isAdmin && !isSuperAdmin)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const whereClause: any = {};

    if (action) whereClause.action = { contains: action };
    if (userId) whereClause.actorId = userId;
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = ['ID', 'Date', 'User', 'Email', 'Action', 'Target Type', 'Target ID', 'Details'];
      const rows = logs.map((log: typeof logs[0]) => [
        log.id,
        new Date(log.createdAt).toISOString(),
        log.User?.name || '',
        log.User?.email || '',
        log.action,
        log.targetType,
        log.targetId || '',
        JSON.stringify(log.details),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=audit-logs-${new Date().toISOString()}.csv`,
        },
      });
    } else {
      // JSON format
      return new NextResponse(JSON.stringify(logs, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename=audit-logs-${new Date().toISOString()}.json`,
        },
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
