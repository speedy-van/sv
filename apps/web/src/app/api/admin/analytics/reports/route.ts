import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET - List all reports
export async function GET() {
  // Try custom session first
  const customSession = await getCustomSession();
  let isAdmin = customSession?.user?.role === 'admin';
  let userId = customSession?.user?.id;
  
  if (!customSession?.user) {
    // Fallback to NextAuth
    const session = await getServerSession(authOptions);
    isAdmin = (session?.user as any)?.role === 'admin';
    userId = session?.user?.id;
    if (!session?.user || !isAdmin) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
  
  if (!isAdmin) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // For now, return mock data since we don't have a reports table yet
    const mockReports = [
      {
        id: '1',
        name: 'Daily Revenue Report',
        description: 'Daily revenue breakdown by service type',
        metrics: ['revenue', 'orders', 'aov'],
        dimensions: ['date', 'service_type'],
        filters: { dateRange: '30d' },
        schedule: 'daily' as const,
        recipients: ['admin@speedy-van.co.uk'],
        lastRun: new Date().toISOString(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        createdBy: customSession?.user?.id,
      },
      {
        id: '2',
        name: 'Driver Performance Weekly',
        description: 'Weekly driver performance metrics',
        metrics: ['completion_rate', 'avg_rating', 'driver_earnings'],
        dimensions: ['driver', 'week'],
        filters: { dateRange: '4w' },
        schedule: 'weekly' as const,
        recipients: ['ops@speedy-van.co.uk'],
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        createdBy: customSession?.user?.id,
      },
      {
        id: '3',
        name: 'Customer Retention Monthly',
        description: 'Monthly customer retention analysis',
        metrics: ['retention_rate', 'ltv', 'repeat_orders'],
        dimensions: ['customer_segment', 'month'],
        filters: { dateRange: '6m' },
        schedule: 'monthly' as const,
        recipients: ['marketing@speedy-van.co.uk'],
        lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'paused' as const,
        createdAt: new Date().toISOString(),
        createdBy: customSession?.user?.id,
      },
    ];

    await logAudit((customSession?.user?.id ?? 'unknown'), 'read_reports', undefined, { targetType: 'analytics_report', before: null, after: { count: mockReports.length } });

    return Response.json({ reports: mockReports });
  } catch (error) {
    console.error('Reports API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// POST - Create new report
export async function POST(request: NextRequest) {
  const customSession = await getCustomSession();
  const fallbackSession = await getServerSession(authOptions);
  const sessionUser = customSession?.user ?? fallbackSession?.user;

  if (!sessionUser || sessionUser.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      metrics,
      dimensions,
      filters,
      schedule,
      recipients,
    } = body;

    // Validate required fields
    if (!name || !metrics || metrics.length === 0) {
      return new Response('Missing required fields', { status: 400 });
    }

    const createdBy = sessionUser.id ?? 'unknown';

    // Create mock report (in real implementation, save to database)
    const newReport = {
      id: Date.now().toString(),
      name,
      description: description || '',
      metrics,
      dimensions: dimensions || [],
      filters: filters || {},
      schedule: schedule || 'none',
      recipients: recipients || [],
      lastRun: new Date().toISOString(),
      nextRun:
        schedule !== 'none'
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    await logAudit(createdBy, 'create_report', newReport.id, {
      targetType: 'analytics_report',
      before: null,
      after: { reportId: newReport.id, name: newReport.name },
    });

    return Response.json({ report: newReport });
  } catch (error) {
    console.error('Create report error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
