import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { autonomousOpsEngine } from '@/server/tools/AutonomousOpsEngine';
import { prisma } from '@/lib/prisma';
import { createAuditLogEntry } from '@/lib/audit';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/ai-assistant/chat
 * Process natural language requests through the AI Assistant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or superadmin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, adminRole: true },
    });

    const isAdmin = user?.role === 'admin';
    const isSuperAdmin = user?.adminRole === 'superadmin';
    const actorRole = isSuperAdmin ? 'superadmin' : user?.role;

    if (!user || (!isAdmin && !isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, autoExecute = false } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Generate action plan
    const context = {
      userId: session.user.id,
      userRole: actorRole ?? 'admin',
      sessionId: `session_${Date.now()}`,
      timestamp: new Date(),
    };
    
    const plan = await autonomousOpsEngine.generateActionPlan(message, context);

    if (plan.steps.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'لم أتمكن من فهم طلبك. يرجى إعادة الصياغة أو استخدام أمر أكثر وضوحاً.',
        suggestions: [
          'عرض الطلبات غير المعينة',
          'الحصول على السائقين المتاحين',
          'ملخص الإيرادات لهذا الشهر',
          'عرض مؤشرات الأداء الرئيسية لهذا الأسبوع',
          'تحليل أداء السائقين',
        ],
      });
    }

    // If autoExecute is false, just return the plan for confirmation
    if (!autoExecute && plan.riskLevel !== 'low') {
      return NextResponse.json({
        success: true,
        requiresConfirmation: true,
        plan: {
          id: plan.id,
          goal: plan.goal,
          steps: plan.steps.map(s => ({
            id: s.id,
            description: s.description,
            requiresConfirmation: s.requiresConfirmation,
          })),
          estimatedDuration: plan.estimatedDuration,
          riskLevel: plan.riskLevel,
        },
        message: plan.riskLevel === 'high'
          ? '⚠️ هذا الإجراء ذو مخاطر عالية ويتطلب تأكيد مزدوج'
          : '✓ خطة الإجراء جاهزة للتنفيذ',
      });
    }

    // Execute the plan
    const execution = await autonomousOpsEngine.executeActionPlan(plan, context);

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.ip ??
      null;

    await createAuditLogEntry({
      actorId: session.user.id,
      actorRole: actorRole ?? 'admin',
      action: 'AI_ASSISTANT_PLAN_EXECUTED',
      targetType: 'ai_chat',
      targetId: plan.id,
      ipAddress,
      details: {
        message,
        goal: plan.goal,
        stepsExecuted: execution.results.length,
        success: execution.success,
        requiresConfirmation: plan.riskLevel !== 'low',
      },
    });

    return NextResponse.json({
      success: execution.success,
      plan: {
        id: plan.id,
        goal: plan.goal,
      },
      results: execution.results,
      summary: execution.summary,
      message: execution.success 
        ? '✓ تم تنفيذ جميع الخطوات بنجاح'
        : '⚠️ فشل تنفيذ بعض الخطوات',
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/ai-assistant/chat
 * Get available AI tools
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tools = autonomousOpsEngine.listTools();

    return NextResponse.json({
      success: true,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        riskLevel: t.riskLevel,
      })),
      categories: {
        orders: tools.filter(t => t.name.startsWith('get_unassigned') || t.name.includes('order')).length,
        drivers: tools.filter(t => t.name.includes('driver')).length,
        finance: tools.filter(t => t.name.includes('revenue') || t.name.includes('refund') || t.name.includes('financial')).length,
        analytics: tools.filter(t => t.name.includes('kpi') || t.name.includes('analytics') || t.name.includes('trend')).length,
      },
    });

  } catch (error) {
    console.error('AI Assistant tools error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
