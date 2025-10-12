/**
 * Base Email Template
 * Unified template system for all Speedy Van emails
 */

import { COMPANY_INFO, COMPANY_CONTACT } from '@/lib/constants/company';

export interface BaseEmailData {
  customerName: string;
  customerEmail: string;
}

export interface EmailTemplate {
  html: string;
  text: string;
}

export function generateBaseEmailTemplate(
  content: {
    title: string;
    greeting: string;
    mainContent: string;
    nextSteps?: string;
    footerNote?: string;
  },
  data: BaseEmailData
): EmailTemplate {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title} - Speedy Van</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #22c55e; color: white; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .highlight-card { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .contact-info { background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .footer { background: #64748b; color: white; padding: 20px; text-align: center; font-size: 14px; }
    .highlight { color: #22c55e; font-weight: bold; }
    .price { font-size: 18px; font-weight: bold; color: #059669; }
    h1, h2, h3 { margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚐 ${COMPANY_INFO.name}</h1>
      <h2>${content.title}</h2>
    </div>
    
    <div class="content">
      <p>Dear <strong>${data.customerName}</strong>,</p>
      
      <p>${content.greeting}</p>
      
      ${content.mainContent}
      
      ${content.nextSteps ? `
      <h3>📅 What Happens Next?</h3>
      ${content.nextSteps}
      ` : ''}
      
      <div class="contact-info">
        <h3>📞 Need Help?</h3>
        <p><strong>Customer Support:</strong> ${COMPANY_CONTACT.supportPhone}<br>
        <strong>Email Support:</strong> ${COMPANY_CONTACT.supportEmail}<br>
        <strong>Emergency (24/7):</strong> ${COMPANY_CONTACT.emergencyPhone}</p>
        
        <p><em>Our team is here to help make your move perfect!</em></p>
      </div>
      
      ${content.footerNote ? `<p>${content.footerNote}</p>` : ''}
      
      <p>Best regards,<br>
      <strong>The ${COMPANY_INFO.name} Team</strong></p>
    </div>
    
    <div class="footer">
      <p><strong>${COMPANY_INFO.name} Ltd</strong><br>
      ${COMPANY_INFO.address}<br>
      Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}</p>
      <p>© 2024 ${COMPANY_INFO.name}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${COMPANY_INFO.name.toUpperCase()} - ${content.title.toUpperCase()}

Dear ${data.customerName},

${content.greeting}

${content.mainContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}

${content.nextSteps ? `
WHAT HAPPENS NEXT:
${content.nextSteps.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
` : ''}

NEED HELP?
- Customer Support: ${COMPANY_CONTACT.supportPhone}
- Email Support: ${COMPANY_CONTACT.supportEmail}
- Emergency (24/7): ${COMPANY_CONTACT.emergencyPhone}

${content.footerNote || ''}

Thank you for choosing ${COMPANY_INFO.name}!

Best regards,
The ${COMPANY_INFO.name} Team

${COMPANY_INFO.name} Ltd
${COMPANY_INFO.address}
Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}
© 2024 ${COMPANY_INFO.name}. All rights reserved.
  `;

  return { html, text };
}
