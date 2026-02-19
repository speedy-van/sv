/**
 * Email Template Updates for Manual Capture Flow
 * 
 * Update email templates to reflect:
 * - Payment not charged until driver confirms
 * - Driver assignment timeframe (15-30 minutes)
 * - No overpromises about instant/guaranteed service
 */

import { OrderConfirmationData } from './UnifiedEmailService';

/**
 * Order Confirmation Email Template - UPDATED
 */
export function generateOrderConfirmationHTML(data: OrderConfirmationData, isPendingMatch: boolean = false): string {
  const paymentStatusText = isPendingMatch
    ? `
      <tr>
        <td style="padding: 20px; background-color: #FFF3CD; border-left: 4px solid #FFC107; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-weight: 600;">💳 Payment Authorization</p>
          <p style="margin: 5px 0 0 0; color: #856404; font-size: 14px;">
            Your card has been authorized but <strong>NOT charged</strong>. You will only be charged once a driver confirms your booking (typically within 15-30 minutes).
          </p>
        </td>
      </tr>
    `
    : `
      <tr>
        <td style="padding: 20px; background-color: #D4EDDA; border-left: 4px solid #28A745; margin: 20px 0;">
          <p style="margin: 0; color: #155724; font-weight: 600;">✅ Payment Confirmed</p>
          <p style="margin: 5px 0 0 0; color: #155724; font-size: 14px;">
            Your payment has been processed successfully.
          </p>
        </td>
      </tr>
    `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - ${data.orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #F5F5F5;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F5F5;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #FFFFFF; font-size: 28px;">🎉 Booking Confirmed!</h1>
                  <p style="margin: 10px 0 0 0; color: #FFFFFF; font-size: 16px;">Order #${data.orderNumber}</p>
                </td>
              </tr>

              <!-- Payment Status -->
              ${paymentStatusText}

              <!-- Booking Details -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px;">Booking Details</h2>
                  
                  <table width="100%" cellpadding="10" cellspacing="0" border="0" style="background-color: #F8F9FA; border-radius: 6px;">
                    <tr>
                      <td style="color: #666666; font-size: 14px; width: 40%;">📍 Pickup:</td>
                      <td style="color: #333333; font-size: 14px; font-weight: 600;">${data.pickupAddress}</td>
                    </tr>
                    <tr>
                      <td style="color: #666666; font-size: 14px;">📍 Drop-off:</td>
                      <td style="color: #333333; font-size: 14px; font-weight: 600;">${data.dropoffAddress}</td>
                    </tr>
                    <tr>
                      <td style="color: #666666; font-size: 14px;">📅 Scheduled:</td>
                      <td style="color: #333333; font-size: 14px; font-weight: 600;">${data.scheduledDate}</td>
                    </tr>
                    <tr>
                      <td style="color: #666666; font-size: 14px;">💰 Total:</td>
                      <td style="color: #333333; font-size: 18px; font-weight: 700;">£${data.totalAmount.toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- What's Next -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">What happens next?</h3>
                  
                  <div style="background-color: #F8F9FA; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6;">
                      <strong>1. Driver Assignment</strong><br>
                      We're finding the best driver for your job. You'll receive a notification when a driver confirms (typically within 15-30 minutes).
                    </p>
                  </div>

                  <div style="background-color: #F8F9FA; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6;">
                      <strong>2. Driver Details</strong><br>
                      Once assigned, we'll send you the driver's name, phone number, and vehicle details.
                    </p>
                  </div>

                  <div style="background-color: #F8F9FA; padding: 15px; border-radius: 6px;">
                    <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6;">
                      <strong>3. Track Your Booking</strong><br>
                      Track your booking status at any time: <a href="https://speedy-van.co.uk/track" style="color: #667EEA;">Track Order</a>
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Support -->
              <tr>
                <td style="padding: 0 30px 30px 30px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 14px;">
                    Need help? Contact us:<br>
                    <a href="tel:01202129746" style="color: #667EEA; text-decoration: none; font-weight: 600;">📞 01202 129746</a><br>
                    <a href="mailto:support@speedy-van.co.uk" style="color: #667EEA; text-decoration: none;">✉️ support@speedy-van.co.uk</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #F8F9FA; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} Speedy Van. All rights reserved.<br>
                    Office 2.18, 1 Barrack St, Hamilton ML3 0HS
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
}

/**
 * Driver Assigned Email Template - NEW
 */
export function generateDriverAssignedHTML(data: {
  customerName: string;
  orderNumber: string;
  driverName: string;
  driverPhone: string;
  vehicleDetails: string;
  scheduledDate: string;
  trackingUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Driver Assigned - ${data.orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F5F5F5;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F5F5;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px;">
              
              <tr>
                <td style="background: linear-gradient(135deg, #28A745 0%, #20C997 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #FFFFFF; font-size: 28px;">🚚 Driver Assigned!</h1>
                  <p style="margin: 10px 0 0 0; color: #FFFFFF; font-size: 16px;">Order #${data.orderNumber}</p>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px;">
                  <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                    Hi ${data.customerName},
                  </p>
                  <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                    Great news! A driver has been assigned to your booking.
                  </p>

                  <div style="background-color: #F8F9FA; padding: 20px; border-radius: 6px; border-left: 4px solid #28A745;">
                    <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">Your Driver</h3>
                    <p style="margin: 0 0 10px 0; color: #333333; font-size: 16px;"><strong>👤 Name:</strong> ${data.driverName}</p>
                    <p style="margin: 0 0 10px 0; color: #333333; font-size: 16px;"><strong>📱 Phone:</strong> <a href="tel:${data.driverPhone}" style="color: #667EEA;">${data.driverPhone}</a></p>
                    <p style="margin: 0; color: #333333; font-size: 16px;"><strong>🚐 Vehicle:</strong> ${data.vehicleDetails}</p>
                  </div>

                  <div style="margin: 20px 0; padding: 15px; background-color: #D4EDDA; border-radius: 6px;">
                    <p style="margin: 0; color: #155724; font-size: 14px;">
                      <strong>💳 Payment Captured</strong><br>
                      Your payment has now been processed as the driver has confirmed.
                    </p>
                  </div>

                  <p style="margin: 20px 0; color: #333333; font-size: 16px;">
                    <strong>📅 Scheduled:</strong> ${data.scheduledDate}
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.trackingUrl}" style="display: inline-block; padding: 15px 30px; background-color: #667EEA; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Track Your Booking
                    </a>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="background-color: #F8F9FA; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} Speedy Van
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
}

/**
 * No Driver Available Email Template - NEW
 */
export function generateNoDriverHTML(data: {
  customerName: string;
  orderNumber: string;
  alternativesUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Driver Not Found - ${data.orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F5F5F5;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F5F5;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px;">
              
              <tr>
                <td style="background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #FFFFFF; font-size: 28px;">⏰ Driver Not Available</h1>
                  <p style="margin: 10px 0 0 0; color: #FFFFFF; font-size: 16px;">Order #${data.orderNumber}</p>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px;">
                  <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                    Hi ${data.customerName},
                  </p>
                  <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                    Unfortunately, no driver was available to accept your booking within the expected timeframe. All our drivers are currently busy.
                  </p>

                  <div style="background-color: #FFF3CD; padding: 20px; border-radius: 6px; border-left: 4px solid #FFC107; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      <strong>💳 No Charge Applied</strong><br>
                      Your card has NOT been charged. The payment authorization will be released automatically.
                    </p>
                  </div>

                  <h3 style="margin: 30px 0 15px 0; color: #333333; font-size: 18px;">Choose an Alternative:</h3>

                  <div style="background-color: #F8F9FA; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #333333; font-size: 14px;">
                      <strong>⏰ Reschedule</strong><br>
                      Choose a different time when more drivers are available
                    </p>
                  </div>

                  <div style="background-color: #F8F9FA; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #333333; font-size: 14px;">
                      <strong>💰 Add Surge Pricing</strong><br>
                      Increase the price to attract available drivers faster
                    </p>
                  </div>

                  <div style="background-color: #F8F9FA; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #333333; font-size: 14px;">
                      <strong>❌ Cancel</strong><br>
                      Cancel the booking with no charge
                    </p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.alternativesUrl}" style="display: inline-block; padding: 15px 30px; background-color: #667EEA; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Choose Alternative
                    </a>
                  </div>

                  <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; text-align: center;">
                    Need help? Call us at <a href="tel:01202129746" style="color: #667EEA;">01202 129746</a>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background-color: #F8F9FA; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} Speedy Van
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
}

/**
 * SMS Templates
 */
export const SMS_TEMPLATES = {
  ORDER_CONFIRMATION_PENDING: (orderRef: string) =>
    `Speedy Van: Booking ${orderRef} confirmed! Finding driver (15-30 min). No charge until confirmed. Track: https://speedy-van.co.uk/track`,

  ORDER_CONFIRMATION_IMMEDIATE: (orderRef: string) =>
    `Speedy Van: Booking ${orderRef} confirmed & paid! We'll notify you when driver is assigned. Track: https://speedy-van.co.uk/track`,

  DRIVER_ASSIGNED: (orderRef: string, driverName: string, driverPhone: string) =>
    `Speedy Van: Driver ${driverName} assigned to ${orderRef}! Contact: ${driverPhone}. Track: https://speedy-van.co.uk/track`,

  NO_DRIVER_AVAILABLE: (orderRef: string) =>
    `Speedy Van: No driver available for ${orderRef}. No charge applied. Choose alternative: https://speedy-van.co.uk/booking/${orderRef}/alternatives`,

  DRIVER_EN_ROUTE: (orderRef: string, eta: string) =>
    `Speedy Van: Driver en route for ${orderRef}. ETA: ${eta}. Track: https://speedy-van.co.uk/track`,

  DELIVERY_COMPLETED: (orderRef: string) =>
    `Speedy Van: Delivery ${orderRef} completed! Thank you for choosing us. Leave review: https://speedy-van.co.uk/review`,
};
