import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { groqService, AdminContext, ChatMessage, AdminIssue } from '@/lib/ai/groqService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    console.log('📞 POST /api/admin/ai/chat called');
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      console.log('❌ Unauthorized - Admin access required');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    console.log('✅ Admin session found:', { userId: session.user.id, email: session.user.email });

    const body = await request.json();
    const { message, conversationHistory = [], language = 'en', issueType, issueContext } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get admin user details
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

    // Build admin context
    const adminContext: AdminContext = {
      adminId: adminUser.id,
      adminName: adminUser.name || 'Admin',
      adminEmail: adminUser.email || '',
      adminRole: (session.user as any).adminRole || 'admin',
      language: language === 'ar' ? 'ar' : 'en',
    };

    // Build issue context if provided
    let issue: AdminIssue | undefined;
    if (issueType) {
      issue = {
        type: issueType,
        description: issueContext?.description,
        context: issueContext,
      };
    }

    // Convert conversation history format
    const history: ChatMessage[] = (conversationHistory || []).map((msg: any) => ({
      role: msg.role || 'user',
      content: msg.content || msg.message || '',
    }));

    // Get AI response
    const result = await groqService.chat(message, adminContext, history, issue);

    // Log the interaction (optional)
    try {
      await prisma.auditLog.create({
        data: {
          actorId: adminUser.id,
          actorRole: 'admin',
          action: 'ai_chat',
          targetType: 'ai_assistant',
          targetId: 'speedy-ai',
          details: {
            message: message.substring(0, 500), // Limit length
            responseLength: result.response.length,
            language: result.language,
            issueType: issueType || null,
          },
        },
      });
    } catch (auditError) {
      console.warn('Failed to log AI chat:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      language: result.language,
      timestamp: new Date().toISOString(),
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

