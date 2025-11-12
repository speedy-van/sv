import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AdminContext, AdminIssue } from '@/lib/ai/groqService';
import { runAdminChat, runAdminChatStream, logAdminChatInteraction } from '@/lib/services/admin-ai-assistant';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const historyMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']).optional(),
  content: z.string().optional(),
  message: z.string().optional(),
});

const issueSchema = z.object({
  type: z.enum(['order', 'driver', 'customer', 'payment', 'route', 'system', 'general']),
  description: z.string().optional(),
  context: z.any().optional(),
});

const adminChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationHistory: z.array(historyMessageSchema).optional(),
  language: z.enum(['en', 'ar']).optional(),
  issue: issueSchema.optional(),
  mode: z.enum(['stream', 'sync']).optional(),
});

export async function POST(request: NextRequest) {
  console.log('🤖 [AI CHAT] POST /api/admin/ai/chat called');
  try {
    const session = await getServerSession(authOptions);
    console.log('🤖 [AI CHAT] Session:', { hasSession: !!session, role: (session?.user as any)?.role });

    if (!session?.user || (session.user as any).role !== 'admin') {
      console.log('❌ [AI CHAT] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const parsed = adminChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      message,
      conversationHistory = [],
      language = 'en',
      issue,
      mode = 'stream',
    } = parsed.data;

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    const adminContext: AdminContext = {
      adminId: adminUser.id,
      adminName: adminUser.name || 'Admin',
      adminEmail: adminUser.email || '',
      adminRole: (session.user as any).adminRole || 'admin',
      language,
    };

    const issuePayload: AdminIssue | undefined = issue
      ? {
          type: issue.type,
          description: issue.description,
          context: issue.context,
        }
      : undefined;

    const chatRequest = {
      message,
      adminContext,
      conversationHistory,
      issue: issuePayload,
    };

    if (mode === 'sync') {
      const startedAt = Date.now();
      const result = await runAdminChat(chatRequest);
      const processingTimeMs = Date.now() - startedAt;

      await logAdminChatInteraction({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        adminName: adminUser.name,
        metadata: result.metadata,
        message,
        response: result.response,
        success: true,
        issue: issuePayload,
        processingTimeMs,
      });

      return NextResponse.json({
        success: true,
        response: result.response,
        language: result.language,
        metadata: result.metadata,
        processingTimeMs,
        timestamp: new Date().toISOString(),
      });
    }

    const sessionResult = await runAdminChatStream(chatRequest);
    const encoder = new TextEncoder();
    const startedAt = Date.now();

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        try {
          for await (const chunk of sessionResult.stream) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ event: 'token', data: chunk }) + '\n'
              )
            );
          }

          const processingTimeMs = Date.now() - startedAt;

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                event: 'final',
                data: {
                  response: fullResponse,
                  language: sessionResult.language,
                  metadata: sessionResult.metadata,
                  processingTimeMs,
                },
              }) + '\n'
            )
          );
          controller.close();

          await logAdminChatInteraction({
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            adminName: adminUser.name,
            metadata: sessionResult.metadata,
            message,
            response: fullResponse,
            success: true,
            issue: issuePayload,
            processingTimeMs,
          });
        } catch (streamError: any) {
          console.error('Admin chat streaming error:', streamError);
          const processingTimeMs = Date.now() - startedAt;
          const errorMessage =
            language === 'ar'
              ? 'حدث خطأ أثناء توليد الرد من Speedy AI.'
              : 'Speedy AI failed to generate a response.';

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                event: 'error',
                data: { message: errorMessage },
              }) + '\n'
            )
          );
          controller.close();

          await logAdminChatInteraction({
            adminId: adminUser.id,
            adminEmail: adminUser.email,
            adminName: adminUser.name,
            metadata: sessionResult.metadata,
            message,
            response: fullResponse,
            success: false,
            issue: issuePayload,
            processingTimeMs,
          });
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process chat request',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'Speedy AI Chat',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
}

