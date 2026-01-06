/**
 * B2B Email Templates
 * 
 * Email templates for B2B company communications
 */

import { COMPANY_INFO, COMPANY_CONTACT } from '@/lib/constants/company';

export interface B2BEmailData {
  companyName: string;
  contactName: string;
  contactEmail: string;
}

/**
 * Base B2B email template with corporate styling
 */
function generateB2BBaseTemplate(
  content: {
    title: string;
    preheader?: string;
    mainContent: string;
    ctaButton?: { text: string; url: string };
    footerNote?: string;
  },
  data: B2BEmailData
): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title} - Speedy Van B2B</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1f2937; 
      margin: 0; 
      padding: 0;
      background-color: #f3f4f6;
    }
    .wrapper { padding: 20px; }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white; 
      padding: 30px 40px;
    }
    .header-logo {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .header-subtitle {
      font-size: 14px;
      opacity: 0.9;
    }
    .content { padding: 40px; }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 20px 0;
    }
    .card { 
      background: #f9fafb; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px; 
      padding: 20px; 
      margin: 20px 0; 
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; font-size: 14px; }
    .info-value { font-weight: 600; color: #111827; }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white !important;
      padding: 14px 28px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .cta-button:hover { background: #1d4ed8; }
    .alert-box {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 15px 20px;
      margin: 20px 0;
    }
    .alert-box.success {
      background: #d1fae5;
      border-color: #10b981;
    }
    .alert-box.danger {
      background: #fee2e2;
      border-color: #ef4444;
    }
    .footer { 
      background: #1f2937; 
      color: #9ca3af; 
      padding: 30px 40px;
      font-size: 13px;
    }
    .footer a { color: #60a5fa; text-decoration: none; }
    .footer-links { margin-bottom: 15px; }
    .footer-links a { margin-right: 20px; }
    .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
    .text-muted { color: #6b7280; font-size: 14px; }
    .text-small { font-size: 12px; }
    .highlight { color: #2563eb; font-weight: 600; }
    .price { font-size: 28px; font-weight: bold; color: #059669; }
    @media only screen and (max-width: 600px) {
      .content { padding: 20px; }
      .header { padding: 20px; }
      .footer { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">🚐 ${COMPANY_INFO.name}</div>
        <div class="header-subtitle">Business Solutions</div>
      </div>
      
      <div class="content">
        <h1 class="title">${content.title}</h1>
        
        <p>Dear <strong>${data.contactName}</strong>,</p>
        
        ${content.mainContent}
        
        ${content.ctaButton ? `
        <div style="text-align: center;">
          <a href="${content.ctaButton.url}" class="cta-button">${content.ctaButton.text}</a>
        </div>
        ` : ''}
        
        ${content.footerNote ? `
        <div class="divider"></div>
        <p class="text-muted">${content.footerNote}</p>
        ` : ''}
        
        <div class="divider"></div>
        
        <p>Best regards,<br>
        <strong>The ${COMPANY_INFO.name} Business Team</strong></p>
      </div>
      
      <div class="footer">
        <div class="footer-links">
          <a href="https://speedyvan.com/b2b/dashboard">Dashboard</a>
          <a href="https://speedyvan.com/b2b/api-docs">API Docs</a>
          <a href="https://speedyvan.com/b2b/support">Support</a>
        </div>
        <p><strong>${COMPANY_INFO.name} Ltd</strong><br>
        ${COMPANY_INFO.address}</p>
        <p class="text-small">
          This email was sent to ${data.contactEmail} because you are registered as a contact for ${data.companyName}.
          <br>© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${COMPANY_INFO.name.toUpperCase()} - BUSINESS SOLUTIONS
${content.title.toUpperCase()}

Dear ${data.contactName},

${content.mainContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()}

${content.ctaButton ? `${content.ctaButton.text}: ${content.ctaButton.url}` : ''}

${content.footerNote || ''}

Best regards,
The ${COMPANY_INFO.name} Business Team

---
${COMPANY_INFO.name} Ltd
${COMPANY_INFO.address}
Phone: ${COMPANY_INFO.phone}
Email: ${COMPANY_INFO.email}
  `;

  return { html, text };
}

/**
 * Company Welcome Email
 */
export function generateCompanyWelcomeEmail(data: B2BEmailData & {
  loginUrl: string;
  apiDocsUrl: string;
  creditLimit: string;
}): { html: string; text: string; subject: string } {
  const content = generateB2BBaseTemplate({
    title: 'Welcome to Speedy Van Business',
    mainContent: `
      <p>We're excited to welcome <strong>${data.companyName}</strong> to the Speedy Van Business platform!</p>
      
      <div class="card">
        <h3 style="margin-top: 0;">Your Account Details</h3>
        <div class="info-row">
          <span class="info-label">Company</span>
          <span class="info-value">${data.companyName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Credit Limit</span>
          <span class="info-value">${data.creditLimit}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Account Status</span>
          <span class="info-value" style="color: #10b981;">Active</span>
        </div>
      </div>
      
      <h3>Getting Started</h3>
      <ol>
        <li><strong>Access your dashboard</strong> - View bookings, invoices, and manage your team</li>
        <li><strong>Generate API keys</strong> - Integrate our services into your systems</li>
        <li><strong>Invite team members</strong> - Add colleagues to your account</li>
        <li><strong>Create your first booking</strong> - Experience our streamlined booking process</li>
      </ol>
      
      <div class="alert-box success">
        <strong>🎉 Special Offer:</strong> Your first 5 bookings include free insurance upgrade!
      </div>
    `,
    ctaButton: {
      text: 'Access Your Dashboard',
      url: data.loginUrl,
    },
    footerNote: `Need help getting started? Our dedicated business support team is available at ${COMPANY_CONTACT.supportEmail}`,
  }, data);

  return {
    ...content,
    subject: `Welcome to Speedy Van Business - ${data.companyName}`,
  };
}

/**
 * API Key Created Email
 */
export function generateApiKeyCreatedEmail(data: B2BEmailData & {
  keyName: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt?: string;
}): { html: string; text: string; subject: string } {
  const content = generateB2BBaseTemplate({
    title: 'New API Key Created',
    mainContent: `
      <p>A new API key has been created for your company account.</p>
      
      <div class="card">
        <h3 style="margin-top: 0;">API Key Details</h3>
        <div class="info-row">
          <span class="info-label">Key Name</span>
          <span class="info-value">${data.keyName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Key Prefix</span>
          <span class="info-value"><code>${data.keyPrefix}...</code></span>
        </div>
        <div class="info-row">
          <span class="info-label">Scopes</span>
          <span class="info-value">${data.scopes.length} permissions</span>
        </div>
        ${data.expiresAt ? `
        <div class="info-row">
          <span class="info-label">Expires</span>
          <span class="info-value">${data.expiresAt}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="alert-box">
        <strong>⚠️ Security Notice:</strong> If you did not create this API key, please revoke it immediately and contact our support team.
      </div>
      
      <h3>Granted Permissions</h3>
      <ul>
        ${data.scopes.map(scope => `<li><code>${scope}</code></li>`).join('')}
      </ul>
    `,
    ctaButton: {
      text: 'Manage API Keys',
      url: 'https://speedyvan.com/b2b/dashboard/api-keys',
    },
    footerNote: 'For security, the full API key is only shown once when created. Store it securely.',
  }, data);

  return {
    ...content,
    subject: `New API Key Created - ${data.keyName}`,
  };
}

/**
 * Invoice Email
 */
export function generateInvoiceEmail(data: B2BEmailData & {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  vat: string;
  total: string;
  itemCount: number;
  paymentUrl: string;
  pdfUrl: string;
}): { html: string; text: string; subject: string } {
  const content = generateB2BBaseTemplate({
    title: `Invoice ${data.invoiceNumber}`,
    mainContent: `
      <p>Please find attached your invoice for recent delivery services.</p>
      
      <div class="card">
        <h3 style="margin-top: 0;">Invoice Summary</h3>
        <div class="info-row">
          <span class="info-label">Invoice Number</span>
          <span class="info-value">${data.invoiceNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Invoice Date</span>
          <span class="info-value">${data.invoiceDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Due Date</span>
          <span class="info-value">${data.dueDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Items</span>
          <span class="info-value">${data.itemCount} deliveries</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label">Subtotal</span>
          <span class="info-value">${data.subtotal}</span>
        </div>
        <div class="info-row">
          <span class="info-label">VAT (20%)</span>
          <span class="info-value">${data.vat}</span>
        </div>
        <div class="info-row">
          <span class="info-label"><strong>Total Due</strong></span>
          <span class="price">${data.total}</span>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.paymentUrl}" class="cta-button">Pay Now</a>
        <br><br>
        <a href="${data.pdfUrl}" style="color: #2563eb;">Download PDF Invoice</a>
      </div>
      
      <h3>Payment Methods</h3>
      <ul>
        <li><strong>Bank Transfer:</strong> Sort Code: 12-34-56, Account: 12345678</li>
        <li><strong>Online:</strong> Pay securely via our payment portal</li>
        <li><strong>Direct Debit:</strong> Contact us to set up automatic payments</li>
      </ul>
    `,
    footerNote: `Payment is due by ${data.dueDate}. Late payments may incur additional charges.`,
  }, data);

  return {
    ...content,
    subject: `Invoice ${data.invoiceNumber} - ${data.total} Due ${data.dueDate}`,
  };
}

/**
 * Quote Email
 */
export function generateQuoteEmail(data: B2BEmailData & {
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  pickupAddress: string;
  deliveryAddress: string;
  vehicleType: string;
  price: string;
  acceptUrl: string;
}): { html: string; text: string; subject: string } {
  const content = generateB2BBaseTemplate({
    title: `Quote ${data.quoteNumber}`,
    mainContent: `
      <p>Thank you for your delivery request. Here's your quote:</p>
      
      <div class="card">
        <h3 style="margin-top: 0;">Quote Details</h3>
        <div class="info-row">
          <span class="info-label">Quote Number</span>
          <span class="info-value">${data.quoteNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Valid Until</span>
          <span class="info-value">${data.validUntil}</span>
        </div>
      </div>
      
      <div class="card">
        <h3 style="margin-top: 0;">Delivery Information</h3>
        <div class="info-row">
          <span class="info-label">Pickup</span>
          <span class="info-value">${data.pickupAddress}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Delivery</span>
          <span class="info-value">${data.deliveryAddress}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Vehicle</span>
          <span class="info-value">${data.vehicleType}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span class="info-label"><strong>Quoted Price</strong></span>
          <span class="price">${data.price}</span>
        </div>
      </div>
      
      <div class="alert-box">
        <strong>⏰ This quote expires on ${data.validUntil}</strong><br>
        Accept now to lock in this price.
      </div>
    `,
    ctaButton: {
      text: 'Accept Quote & Book',
      url: data.acceptUrl,
    },
    footerNote: 'Price includes VAT. Additional charges may apply for waiting time or special requirements.',
  }, data);

  return {
    ...content,
    subject: `Quote ${data.quoteNumber} - ${data.price} - ${data.companyName}`,
  };
}

/**
 * Credit Limit Warning Email
 */
export function generateCreditLimitWarningEmail(data: B2BEmailData & {
  creditLimit: string;
  currentBalance: string;
  availableCredit: string;
  usagePercent: number;
}): { html: string; text: string; subject: string } {
  const content = generateB2BBaseTemplate({
    title: 'Credit Limit Warning',
    mainContent: `
      <p>This is a notification that your company account is approaching its credit limit.</p>
      
      <div class="alert-box danger">
        <strong>⚠️ ${data.usagePercent}% of credit limit used</strong>
      </div>
      
      <div class="card">
        <h3 style="margin-top: 0;">Account Balance</h3>
        <div class="info-row">
          <span class="info-label">Credit Limit</span>
          <span class="info-value">${data.creditLimit}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Current Balance</span>
          <span class="info-value" style="color: #dc2626;">${data.currentBalance}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Available Credit</span>
          <span class="info-value">${data.availableCredit}</span>
        </div>
      </div>
      
      <h3>What You Can Do</h3>
      <ul>
        <li><strong>Make a payment</strong> - Clear outstanding invoices to free up credit</li>
        <li><strong>Request a limit increase</strong> - Contact us to discuss your credit needs</li>
        <li><strong>Set up Direct Debit</strong> - Automatic payments keep your account clear</li>
      </ul>
      
      <p>Once your credit limit is reached, new bookings will require upfront payment until the balance is reduced.</p>
    `,
    ctaButton: {
      text: 'View Outstanding Invoices',
      url: 'https://speedyvan.com/b2b/dashboard/invoices',
    },
    footerNote: 'Need to increase your credit limit? Contact our business team at business@speedyvan.com',
  }, data);

  return {
    ...content,
    subject: `Credit Limit Warning - ${data.usagePercent}% Used - ${data.companyName}`,
  };
}

/**
 * Company Invitation Email
 */
export function generateCompanyInvitationEmail(data: {
  inviteeName: string;
  inviteeEmail: string;
  companyName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
  expiresAt: string;
}): { html: string; text: string; subject: string } {
  const content = generateB2BBaseTemplate({
    title: `You're Invited to Join ${data.companyName}`,
    mainContent: `
      <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.companyName}</strong> on the Speedy Van Business platform.</p>
      
      <div class="card">
        <h3 style="margin-top: 0;">Invitation Details</h3>
        <div class="info-row">
          <span class="info-label">Company</span>
          <span class="info-value">${data.companyName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Your Role</span>
          <span class="info-value">${data.role}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Invited By</span>
          <span class="info-value">${data.inviterName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Expires</span>
          <span class="info-value">${data.expiresAt}</span>
        </div>
      </div>
      
      <h3>What You'll Get Access To</h3>
      <ul>
        <li>Create and manage delivery bookings</li>
        <li>Track shipments in real-time</li>
        <li>View invoices and payment history</li>
        <li>Access company-specific pricing</li>
      </ul>
    `,
    ctaButton: {
      text: 'Accept Invitation',
      url: data.acceptUrl,
    },
    footerNote: `This invitation expires on ${data.expiresAt}. If you don't recognize this invitation, you can safely ignore this email.`,
  }, {
    companyName: data.companyName,
    contactName: data.inviteeName || 'there',
    contactEmail: data.inviteeEmail,
  });

  return {
    ...content,
    subject: `You're Invited to Join ${data.companyName} on Speedy Van`,
  };
}

/**
 * Booking Confirmation Email (B2B)
 */
export function generateB2BBookingConfirmationEmail(data: B2BEmailData & {
  bookingReference: string;
  pickupDate: string;
  pickupTime: string;
  pickupAddress: string;
  deliveryAddress: string;
  vehicleType: string;
  price: string;
  poNumber?: string;
  trackingUrl: string;
}): { html: string; text: string; subject: string } {
  const content = generateB2BBaseTemplate({
    title: 'Booking Confirmed',
    mainContent: `
      <p>Your delivery booking has been confirmed and scheduled.</p>
      
      <div class="alert-box success">
        <strong>✅ Booking Reference: ${data.bookingReference}</strong>
      </div>
      
      <div class="card">
        <h3 style="margin-top: 0;">Booking Details</h3>
        ${data.poNumber ? `
        <div class="info-row">
          <span class="info-label">PO Number</span>
          <span class="info-value">${data.poNumber}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Pickup Date</span>
          <span class="info-value">${data.pickupDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Pickup Time</span>
          <span class="info-value">${data.pickupTime}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Vehicle</span>
          <span class="info-value">${data.vehicleType}</span>
        </div>
      </div>
      
      <div class="card">
        <h3 style="margin-top: 0;">Route</h3>
        <p><strong>📍 Pickup:</strong><br>${data.pickupAddress}</p>
        <p><strong>📍 Delivery:</strong><br>${data.deliveryAddress}</p>
      </div>
      
      <div class="card">
        <div class="info-row">
          <span class="info-label"><strong>Total Price</strong></span>
          <span class="price">${data.price}</span>
        </div>
        <p class="text-muted text-small">This amount will be added to your monthly invoice.</p>
      </div>
    `,
    ctaButton: {
      text: 'Track Delivery',
      url: data.trackingUrl,
    },
    footerNote: 'Need to modify this booking? Contact us at least 2 hours before the scheduled pickup time.',
  }, data);

  return {
    ...content,
    subject: `Booking Confirmed - ${data.bookingReference} - ${data.pickupDate}`,
  };
}

export default {
  generateCompanyWelcomeEmail,
  generateApiKeyCreatedEmail,
  generateInvoiceEmail,
  generateQuoteEmail,
  generateCreditLimitWarningEmail,
  generateCompanyInvitationEmail,
  generateB2BBookingConfirmationEmail,
};
