import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET - Get specific report
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      createdBy: userId,
    };

    await logAudit(userId || 'unknown', 'read_report', (await params).id, { targetType: 'analytics_report', before: null, after: { reportId: (await params).id } });

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
      createdBy: userId,
    };

    await logAudit(userId || 'unknown', 'update_report', (await params).id, { targetType: 'analytics_report', before: { reportId: (await params).id }, after: { reportId: (await params).id, changes: body } });

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
    // Mock deletion (in real implementation, delete from database)
    await logAudit(userId || 'unknown', 'delete_report', (await params).id, { targetType: 'analytics_report', before: { reportId: (await params).id }, after: null });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete report error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
