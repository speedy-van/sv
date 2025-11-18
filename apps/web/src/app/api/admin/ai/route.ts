import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { coreOrchestrator } from '@/server/ai/CoreOrchestrator';
import { memorySystem } from '@/server/ai/MemorySystem';

/**
 * POST /api/admin/ai
 * Main AI Assistant endpoint with orchestration and memory
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'صلاحيات غير كافية' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { input, sessionId, confirmed = false } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'المدخل مطلوب' },
        { status: 400 }
      );
    }

    // Generate session ID if not provided
    const actualSessionId = sessionId || `session_${Date.now()}`;

    // Get session context and recent entities
    const context = await memorySystem.getSessionContext(session.user.id, actualSessionId);
    const recentEntities = await memorySystem.getRecentEntities(session.user.id, actualSessionId);

    // Enhance input with context if user is referring to previous entities
    let enhancedInput = input;
    if (input.includes('it') || input.includes('this') || input.includes('ه') || input.includes('هذا')) {
      if (context.activeOrderId && !input.includes('order') && !input.includes('طلب')) {
        enhancedInput = `${input} (order #${context.activeOrderId})`;
      }
    }

    // Add conversation turn (user input)
    await memorySystem.addConversationTurn(session.user.id, actualSessionId, {
      role: 'user',
      content: input,
    });

    // Execute with orchestrator
    const result = await coreOrchestrator.orchestrate(enhancedInput, {
      userId: session.user.id,
      userRole: session.user.role,
      sessionId: actualSessionId,
      timestamp: new Date(),
      metadata: {
        confirmed,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    // Handle confirmation requirement
    if (result.error === 'requires_confirmation') {
      return NextResponse.json({
        requiresConfirmation: true,
        intent: result.intent,
        message: 'هذه العملية تتطلب تأكيداً',
        sessionId: actualSessionId,
      });
    }

    // Add conversation turn (assistant response)
    await memorySystem.addConversationTurn(session.user.id, actualSessionId, {
      role: 'assistant',
      content: result.success ? 'تم التنفيذ بنجاح' : result.error || 'حدث خطأ',
      intent: result.intent.type,
      entities: result.intent.entities,
      result: result.result,
    });

    // Learn from this action
    if (result.intent.type !== 'unknown') {
      await memorySystem.learnFromAction(
        result.intent.goal,
        result.tool || result.agent || 'unknown',
        result.success
      );
    }

    // Get contextual suggestions for next action
    const suggestions = await memorySystem.getContextualSuggestions(session.user.id, actualSessionId);

    // Return result
    return NextResponse.json({
      success: result.success,
      data: result.result,
      error: result.error,
      intent: result.intent,
      agent: result.agent,
      tool: result.tool,
      executionTime: result.executionTime,
      sessionId: actualSessionId,
      suggestions,
      dashboardUpdate: result.dashboardUpdate,
      auditLogId: result.auditLogId,
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير متوقع' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/ai
 * Get AI system status and session info
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'صلاحيات غير كافية' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    let sessionInfo = null;
    if (sessionId) {
      sessionInfo = memorySystem.getMemorySummary(session.user.id, sessionId);
    }

    const status = coreOrchestrator.getStatus();

    return NextResponse.json({
      status,
      sessionInfo,
    });

  } catch (error) {
    console.error('AI Assistant status error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب حالة النظام' },
      { status: 500 }
    );
  }
}
