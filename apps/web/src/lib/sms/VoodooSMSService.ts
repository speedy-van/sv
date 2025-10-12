/**
 * Voodoo SMS Service - Production SMS Provider
 * Complete replacement for UK SMS WORK
 */

export interface SMSData {
  to: string;
  message: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  credits?: number;
}

export class VoodooSMSService {
  private apiKey: string;
  private baseUrl = 'https://www.voodoosms.com/vapi/server/sendSMS';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Voodoo SMS API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Normalize UK phone number to 0044 format
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all spaces, dashes, and brackets
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Convert to 0044 format
    if (cleaned.startsWith('+44')) {
      cleaned = '0044' + cleaned.substring(3);
    } else if (cleaned.startsWith('44') && !cleaned.startsWith('0044')) {
      cleaned = '0044' + cleaned.substring(2);
    } else if (cleaned.startsWith('0') && !cleaned.startsWith('0044')) {
      // Convert 07... to 00447...
      cleaned = '0044' + cleaned.substring(1);
    }

    return cleaned;
  }

  /**
   * Send SMS via Voodoo SMS API
   */
  async sendSMS(data: SMSData): Promise<SMSResponse> {
    console.log('DISABLE_SMS env:', process.env.DISABLE_SMS);
    // Check if SMS is disabled
    if (process.env.DISABLE_SMS === 'true') {
      console.log('⚠️  SMS sending is disabled via DISABLE_SMS=true');
      return {
        success: true,
        messageId: 'disabled_' + Date.now(),
        credits: 0,
      };
    }
    try {
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(data.to);

      // Validate phone format
      if (!normalizedPhone.startsWith('0044')) {
        return {
          success: false,
          error: 'Invalid UK phone number format. Must start with 0044',
        };
      }

      console.log('=== VOODOO SMS REQUEST ===');
      console.log('URL:', this.baseUrl);
      console.log('To (original):', data.to);
      console.log('To (normalized):', normalizedPhone);
      console.log('Message:', data.message);
      console.log('API Key:', this.apiKey.substring(0, 20) + '...');

      // Prepare request payload for Voodoo SMS
      const payload = {
        uid: this.apiKey,
        to: normalizedPhone,
        message: data.message,
        from: 'SpeedyVan',
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Send SMS (first attempt)
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('=== VOODOO SMS RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);

      const responseText = await response.text();
      console.log('Response Body:', responseText);

      // Parse response
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch {
        // If response is not JSON, treat as text
        result = { rawResponse: responseText };
      }

      // Check if successful
      if (response.ok) {
        console.log('✅ SMS sent successfully via Voodoo SMS');
        return {
          success: true,
          messageId: result.id || result.messageId || 'voodoo_' + Date.now(),
          credits: result.credits || 1,
        };
      }

      // First attempt failed - try retry
      console.warn('⚠️  First attempt failed, retrying...');
      
      const retryResponse = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const retryText = await retryResponse.text();
      console.log('Retry Status:', retryResponse.status);
      console.log('Retry Response:', retryText);

      if (retryResponse.ok) {
        const retryResult = JSON.parse(retryText);
        console.log('✅ SMS sent successfully via Voodoo SMS (retry)');
        return {
          success: true,
          messageId: retryResult.id || retryResult.messageId || 'voodoo_retry_' + Date.now(),
          credits: retryResult.credits || 1,
        };
      }

      // Both attempts failed
      console.error('❌ SMS send failed after retry');
      return {
        success: false,
        error: `Failed to send SMS: ${response.statusText}`,
      };

    } catch (error) {
      console.error('❌ Voodoo SMS Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send booking confirmation SMS
   */
  async sendBookingConfirmation(data: {
    phoneNumber: string;
    customerName: string;
    orderNumber: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDate: string;
    driverName?: string;
    driverPhone?: string;
  }): Promise<SMSResponse> {
    const message = `Hi ${data.customerName}, your Speedy Van booking ${data.orderNumber} is confirmed! Pickup: ${data.pickupAddress} on ${data.scheduledDate}. We'll notify you when your driver is assigned. Call 07901846297 for support.`;

    return this.sendSMS({
      to: data.phoneNumber,
      message,
    });
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(data: {
    phoneNumber: string;
    customerName: string;
    orderNumber: string;
    amount: number;
  }): Promise<SMSResponse> {
    const message = `Hi ${data.customerName}, payment of £${data.amount.toFixed(2)} received for booking ${data.orderNumber}. Thank you for choosing Speedy Van! Support: 07901846297`;

    return this.sendSMS({
      to: data.phoneNumber,
      message,
    });
  }

  /**
   * Send driver assignment notification
   */
  async sendDriverAssignment(data: {
    phoneNumber: string;
    customerName: string;
    orderNumber: string;
    driverName: string;
    driverPhone: string;
  }): Promise<SMSResponse> {
    const message = `Hi ${data.customerName}, your driver ${data.driverName} has been assigned to booking ${data.orderNumber}. Driver contact: ${data.driverPhone}. Speedy Van support: 07901846297`;

    return this.sendSMS({
      to: data.phoneNumber,
      message,
    });
  }
}

// Export singleton instance
let voodooSMSService: VoodooSMSService | null = null;

export function getVoodooSMSService(): VoodooSMSService {
  const apiKey = process.env.VOODOO_SMS_API_KEY;
  
  if (!apiKey) {
    throw new Error('VOODOO_SMS_API_KEY is not configured in environment variables');
  }

  if (!voodooSMSService) {
    voodooSMSService = new VoodooSMSService(apiKey);
  }

  return voodooSMSService;
}

export default VoodooSMSService;

