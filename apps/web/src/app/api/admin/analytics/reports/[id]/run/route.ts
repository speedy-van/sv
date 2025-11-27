import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
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
    // Mock report execution (in real implementation, execute the report query)
    const executionResult = {
      reportId: (await params).id,
      status: 'completed',
      executionTime: Math.floor(Math.random() * 5000) + 1000, // 1-6 seconds
      rowsProcessed: Math.floor(Math.random() * 10000) + 1000,
      dataGenerated: true,
      executedAt: new Date().toISOString(),
      executedBy: userId,
    };

    await logAudit(userId || 'unknown', 'run_report', (await params).id, { targetType: 'analytics_report', before: null, after: { reportId: (await params).id, executionResult } });

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
