import nodemailer from 'nodemailer';

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
 * Send email using ZeptoMail SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, attachments } = options;

  // Create transporter using ZeptoMail SMTP
  const transporter = nodemailer.createTransporter({
    host: process.env.ZEPTO_HOST || 'smtp.zeptomail.eu',
    port: parseInt(process.env.ZEPTO_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.ZEPTO_USER || 'emailapikey',
      pass: process.env.ZEPTO_PASS || process.env.ZEPTO_API_KEY,
    },
  });

  // Email content
  const mailOptions = {
    from: process.env.MAIL_FROM || 'noreply@speedy-van.co.uk',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    attachments: attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    })),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

