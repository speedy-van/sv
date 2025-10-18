import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Mock report execution (in real implementation, execute the report query)
    const executionResult = {
      reportId: (await params).id,
      status: 'completed',
      executionTime: Math.floor(Math.random() * 5000) + 1000, // 1-6 seconds
      rowsProcessed: Math.floor(Math.random() * 10000) + 1000,
      dataGenerated: true,
      executedAt: new Date().toISOString(),
      executedBy: session.user.id,
    };

    await logAudit(session.user.id, 'run_report', (await params).id, { targetType: 'analytics_report', before: null, after: { reportId: (await params).id, executionResult } });

    return Response.json({
      success: true,
      result: executionResult,
      message: 'Report executed successfully',
    });
  } catch (error) {
    console.error('Run report error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
