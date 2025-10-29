interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, attachments } = options;

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const MAIL_FROM = process.env.MAIL_FROM || 'noreply@speedy-van.co.uk';

  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  // Prepare email payload
  const payload: any = {
    from: `Speedy Van <${MAIL_FROM}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };

  // Add attachments if provided
  if (attachments && attachments.length > 0) {
    payload.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: att.content instanceof Buffer 
        ? att.content.toString('base64') 
        : att.content,
      type: att.contentType || 'application/pdf',
    }));
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Resend API error:', response.status, errorData);
      throw new Error(`Resend API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully via Resend:', result.id);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

