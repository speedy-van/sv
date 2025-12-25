import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DELETE /api/admin/customer-chat/sessions/[id]
 * Delete a customer chat session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;

    // Verify session exists and is a customer chat
    const session = await prisma.chatSession.findFirst({
      where: {
        id,
        type: 'guest_admin',
      },
      include: {
        Message: true,
        ChatParticipant: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Delete all related records
    await prisma.message.deleteMany({
      where: { sessionId: id },
    });

    await prisma.chatParticipant.deleteMany({
      where: { sessionId: id },
    });

    await prisma.chatSession.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    console.error('Delete customer chat session error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

