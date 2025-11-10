import { groqService, type AdminContext, type AdminIssue, type ChatMetadata } from '@/lib/ai/groqService';
import { prisma } from '@/lib/prisma';

export interface AdminChatRequest {
  message: string;
  adminContext: AdminContext;
  conversationHistory?: any[];
  issue?: AdminIssue;
}

export interface AdminChatResult {
  response: string;
  language: 'en' | 'ar';
  metadata: ChatMetadata;
}

export interface AdminChatStreamResult {
  language: 'en' | 'ar';
  metadata: ChatMetadata;
  stream: AsyncGenerator<string, void, unknown>;
}

export async function runAdminChat(request: AdminChatRequest): Promise<AdminChatResult> {
  return groqService.chat(
    request.message,
    request.adminContext,
    request.conversationHistory ?? [],
    request.issue
  );
}

export async function runAdminChatStream(request: AdminChatRequest): Promise<AdminChatStreamResult> {
  return groqService.chatStream(
    request.message,
    request.adminContext,
    request.conversationHistory ?? [],
    request.issue
  );
}

export async function logAdminChatInteraction(params: {
  adminId: string;
  metadata: ChatMetadata;
  message: string;
  response: string;
  success: boolean;
  issue?: AdminIssue;
  adminEmail?: string | null;
  adminName?: string | null;
  processingTimeMs?: number;
}): Promise<void> {
  try {
    const metadataForStorage = JSON.parse(JSON.stringify(params.metadata));
    const referencesForStorage = JSON.parse(JSON.stringify(params.metadata.references));

    await prisma.auditLog.create({
      data: {
        actorId: params.adminId,
        actorRole: 'admin',
        action: 'ai_chat',
        targetType: 'ai_assistant',
        targetId: params.metadata.requestId,
        details: {
          requestId: params.metadata.requestId,
          success: params.success,
          messagePreview: params.message.substring(0, 500),
          responsePreview: params.response.substring(0, 500),
          language: params.metadata.language,
          references: referencesForStorage,
          metadata: metadataForStorage,
          issueType: params.issue?.type ?? null,
          adminEmail: params.adminEmail ?? null,
          adminName: params.adminName ?? null,
          responseLength: params.response.length,
          processingTimeMs: params.processingTimeMs ?? null,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.warn('Failed to log AI chat interaction:', error);
  }
}

