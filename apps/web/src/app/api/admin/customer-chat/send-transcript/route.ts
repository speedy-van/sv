import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/customer-chat/send-transcript
 * Send chat transcript to customer via email
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { sessionId, customerEmail } = body;

    if (!sessionId || !customerEmail) {
      return NextResponse.json(
        { error: 'Session ID and customer email are required' },
        { status: 400 }
      );
    }

    // Fetch session with all messages
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        type: 'guest_admin',
      },
      include: {
        Message: {
          orderBy: { createdAt: 'asc' },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        ChatParticipant: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    const guestParticipant = session.ChatParticipant.find((p) => p.role === 'guest');
    const customerName = guestParticipant?.guestName || 'Customer';

    // Format messages for email
    const messagesHtml = session.Message.map((msg) => {
      const metadata = msg.metadata as any;
      const isGuestMessage = metadata?.isGuestMessage === true;
      const senderName = isGuestMessage
        ? (metadata?.guestName || customerName)
        : (msg.User?.name || 'Support');
      const isAdmin = !isGuestMessage;

      return `
        <div style="margin-bottom: 16px; ${isAdmin ? 'text-align: right;' : 'text-align: left;'}">
          <div style="
            display: inline-block;
            max-width: 70%;
            padding: 12px 16px;
            border-radius: 8px;
            background-color: ${isAdmin ? '#2563EB' : '#F3F4F6'};
            color: ${isAdmin ? '#FFFFFF' : '#111827'};
          ">
            <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">
              ${senderName}
            </div>
            <div style="font-size: 14px; white-space: pre-wrap;">
              ${msg.content.replace(/\n/g, '<br>')}
            </div>
            <div style="font-size: 11px; margin-top: 8px; opacity: 0.7;">
              ${new Date(msg.createdAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Generate email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chat Transcript - Speedy Van</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Speedy Van</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Chat Transcript</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Dear ${customerName},
            </p>
            <p style="font-size: 16px; margin-bottom: 30px;">
              As requested, please find below the complete transcript of your chat conversation with our support team.
            </p>
            
            <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="font-size: 18px; margin-top: 0; margin-bottom: 20px; color: #111827;">Chat Messages</h2>
              ${messagesHtml}
            </div>
            
            <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 14px; color: #6B7280; margin: 0;">
                <strong>Chat Session ID:</strong> ${sessionId}<br>
                <strong>Date:</strong> ${new Date(session.createdAt).toLocaleString('en-GB')}<br>
                ${session.closedAt ? `<strong>Closed:</strong> ${new Date(session.closedAt).toLocaleString('en-GB')}` : ''}
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
              <p style="font-size: 14px; color: #6B7280; margin: 0;">
                If you have any further questions, please don't hesitate to contact us:<br>
                <strong>Email:</strong> support@speedy-van.co.uk<br>
                <strong>Phone:</strong> 01202 129746
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6B7280; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Speedy Van. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    // Send email
    const emailResult = await unifiedEmailService.sendEmail({
      to: customerEmail,
      subject: `Chat Transcript - Speedy Van Support`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }

    return NextResponse.json({
      success: true,
      message: 'Chat transcript sent successfully',
      emailId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Send chat transcript error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

