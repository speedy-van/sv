import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET - Get specific report
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Mock report data (in real implementation, fetch from database)
    const mockReport = {
      id: (await params).id,
      name: 'Sample Report',
      description: 'Sample report description',
      metrics: ['revenue', 'orders'],
      dimensions: ['date'],
      filters: { dateRange: '30d' },
      schedule: 'daily' as const,
      recipients: ['admin@speedy-van.co.uk'],
      lastRun: new Date().toISOString(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    await logAudit((session.user as any).id, 'read_report', (await params).id, { targetType: 'analytics_report', before: null, after: { reportId: (await params).id } });

    return Response.json({ report: mockReport });
  } catch (error) {
    console.error('Get report error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// PATCH - Update report
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
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
      status,
    } = body;

    // Mock update (in real implementation, update database)
    const updatedReport = {
      id: (await params).id,
      name: name || 'Updated Report',
      description: description || '',
      metrics: metrics || ['revenue'],
      dimensions: dimensions || ['date'],
      filters: filters || { dateRange: '30d' },
      schedule: schedule || 'none',
      recipients: recipients || [],
      status: status || 'active',
      lastRun: new Date().toISOString(),
      nextRun:
        schedule !== 'none'
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    await logAudit(session.user.id, 'update_report', (await params).id, { targetType: 'analytics_report', before: { reportId: (await params).id }, after: { reportId: (await params).id, changes: body } });

    return Response.json({ report: updatedReport });
  } catch (error) {
    console.error('Update report error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// DELETE - Delete report
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Mock deletion (in real implementation, delete from database)
    await logAudit(session.user.id, 'delete_report', (await params).id, { targetType: 'analytics_report', before: { reportId: (await params).id }, after: null });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete report error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
