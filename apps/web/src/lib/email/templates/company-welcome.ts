/**
 * Company Welcome Email Template
 * 
 * Sent when B2B application is approved
 */

export interface CompanyWelcomeEmailData {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  apiKeyPreview: string;
  setupUrl: string;
  orderLimit: number;
  supportEmail: string;
}

export function generateCompanyWelcomeEmail(data: CompanyWelcomeEmailData): {
  html: string;
  text: string;
  subject: string;
} {
  const subject = `Welcome to Speedy Van Business Portal - ${data.companyName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Welcome to Speedy Van
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">
                Business Portal
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Dear ${data.ownerName},
              </p>

              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                Congratulations! Your B2B application for <strong>${data.companyName}</strong> has been approved.
              </p>

              <!-- Important Info Box -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">Your Account Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Company:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: bold;">${data.companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Email:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${data.ownerEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;">Monthly Order Limit:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: bold;">${data.orderLimit === 0 ? 'Unlimited' : data.orderLimit + ' bookings'}</td>
                  </tr>
                </table>
              </div>

              <!-- Setup Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.setupUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Set Your Password
                </a>
                <p style="margin: 15px 0 0 0; color: #666; font-size: 13px;">
                  This link expires in 7 days
                </p>
              </div>

              <!-- API Key Section -->
              <div style="background-color: #fff8e1; border: 2px solid #ffd54f; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; color: #f57c00; font-size: 16px;">
                  🔑 Your API Key (Store Securely)
                </h3>
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                  For API integration, your key starts with:
                </p>
                <code style="display: block; background-color: #fff; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #333; word-break: break-all;">
                  ${data.apiKeyPreview}...
                </code>
                <p style="margin: 10px 0 0 0; color: #e65100; font-size: 13px;">
                  ⚠️ The full API key was shown once in the admin approval screen. Contact support if you need a new key.
                </p>
              </div>

              <!-- Getting Started -->
              <h3 style="margin: 30px 0 15px 0; color: #333; font-size: 18px;">Getting Started</h3>
              <ol style="margin: 0; padding-left: 20px; color: #666; font-size: 15px; line-height: 1.8;">
                <li>Click the button above to set your password</li>
                <li>Log in to your business portal</li>
                <li>Start creating bookings via web or API</li>
                <li>Track orders and manage invoices</li>
              </ol>

              <!-- Resources -->
              <h3 style="margin: 30px 0 15px 0; color: #333; font-size: 18px;">Useful Resources</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 15px; line-height: 1.8;">
                <li><a href="https://docs.speedy-van.co.uk/b2b" style="color: #667eea;">API Documentation</a></li>
                <li><a href="https://app.speedy-van.co.uk/company/login" style="color: #667eea;">Business Portal Login</a></li>
                <li><a href="mailto:${data.supportEmail}" style="color: #667eea;">Contact Support</a></li>
              </ul>

              <p style="margin: 30px 0 0 0; color: #333; font-size: 16px; line-height: 1.6;">
                If you have any questions, our support team is here to help.
              </p>

              <p style="margin: 20px 0 0 0; color: #333; font-size: 16px;">
                Best regards,<br>
                <strong>The Speedy Van Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #999; font-size: 13px;">
                Speedy Van Removals Ltd<br>
                Office 2.18, 1 Barrack St, Hamilton ML3 0HS
              </p>
              <p style="margin: 0; color: #999; font-size: 13px;">
                <a href="mailto:${data.supportEmail}" style="color: #667eea; text-decoration: none;">${data.supportEmail}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Welcome to Speedy Van Business Portal

Dear ${data.ownerName},

Congratulations! Your B2B application for ${data.companyName} has been approved.

YOUR ACCOUNT DETAILS
--------------------
Company: ${data.companyName}
Email: ${data.ownerEmail}
Monthly Order Limit: ${data.orderLimit === 0 ? 'Unlimited' : data.orderLimit + ' bookings'}

SET YOUR PASSWORD
-----------------
Click here to set your password (expires in 7 days):
${data.setupUrl}

YOUR API KEY
------------
For API integration, your key starts with: ${data.apiKeyPreview}...

⚠️ IMPORTANT: The full API key was shown once in the admin approval screen. 
Contact support if you need a new key.

GETTING STARTED
---------------
1. Click the link above to set your password
2. Log in to your business portal
3. Start creating bookings via web or API
4. Track orders and manage invoices

USEFUL RESOURCES
----------------
• API Documentation: https://docs.speedy-van.co.uk/b2b
• Business Portal Login: https://app.speedy-van.co.uk/company/login
• Contact Support: ${data.supportEmail}

If you have any questions, our support team is here to help.

Best regards,
The Speedy Van Team

--
Speedy Van Removals Ltd
Office 2.18, 1 Barrack St, Hamilton ML3 0HS
${data.supportEmail}
  `;

  return { html, text, subject };
}
