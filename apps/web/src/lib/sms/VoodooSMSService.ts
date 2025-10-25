/**
 * Voodoo SMS Service - Production SMS Provider
 * CORRECTED VERSION - Using proper REST API endpoints and authentication
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
  balance?: number;
}

export class VoodooSMSService {
  private apiKey: string;
  private baseUrl = 'https://api.voodoosms.com'; // CORRECTED: Using official REST API endpoint
  private recentMessages: Map<string, number> = new Map(); // Track recent messages to prevent duplicates
  private deduplicationWindow = 60000; // 60 seconds window

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Voodoo SMS API key is required');
    }
    this.apiKey = apiKey;
    
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanupOldEntries(), 300000);
  }

  /**
   * Clean up old deduplication entries
   */
  private cleanupOldEntries(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.recentMessages.entries()) {
      if (now - timestamp > this.deduplicationWindow) {
        this.recentMessages.delete(key);
      }
    }
  }

  /**
   * Generate deduplication key for a message
   */
  private getDeduplicationKey(to: string, message: string): string {
    return `${to}:${message.substring(0, 50)}`; // Use phone + first 50 chars of message
  }

  /**
   * Check if message was recently sent (within deduplication window)
   */
  private isDuplicate(to: string, message: string): boolean {
    const key = this.getDeduplicationKey(to, message);
    const lastSent = this.recentMessages.get(key);
    
    if (lastSent && Date.now() - lastSent < this.deduplicationWindow) {
      console.log('⚠️  Duplicate SMS detected - skipping send:', { to, key });
      return true;
    }
    
    return false;
  }

  /**
   * Mark message as sent for deduplication
   */
  private markAsSent(to: string, message: string): void {
    const key = this.getDeduplicationKey(to, message);
    this.recentMessages.set(key, Date.now());
  }

  /**
   * Normalize UK phone number to international format (447...)
   * Voodoo REST API expects numbers in international format without +
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all spaces, dashes, and brackets
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Convert to 447... format (international without +)
    if (cleaned.startsWith('+44')) {
      cleaned = cleaned.substring(1); // Remove + to get 447...
    } else if (cleaned.startsWith('0044')) {
      cleaned = '44' + cleaned.substring(4); // Convert 0044 to 44
    } else if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
      // Convert 07... to 447...
      cleaned = '44' + cleaned.substring(1);
    } else if (!cleaned.startsWith('44')) {
      // Assume it's a UK number without prefix
      cleaned = '44' + cleaned;
    }

    return cleaned;
  }

  /**
   * Send SMS via Voodoo SMS REST API
   * Using REST API with Bearer authentication
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

    // Check for duplicate message (double-click protection)
    if (this.isDuplicate(data.to, data.message)) {
      return {
        success: true,
        messageId: 'duplicate_' + Date.now(),
        credits: 0,
        error: 'Duplicate message prevented',
      };
    }

    try {
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(data.to);

      // Validate phone format
      if (!normalizedPhone.startsWith('44')) {
        return {
          success: false,
          error: 'Invalid UK phone number format. Must be a valid UK number',
        };
      }

      console.log('=== VOODOO SMS REQUEST ===');
      console.log('URL:', `${this.baseUrl}/sendsms`);
      console.log('To (original):', data.to);
      console.log('To (normalized):', normalizedPhone);
      console.log('Message:', data.message);
      console.log('API Key:', this.apiKey.substring(0, 20) + '...');

      // Prepare request payload for Voodoo SMS REST API
      const payload = {
        to: normalizedPhone,
        from: 'SpeedyVan',
        msg: data.message, // REST API uses 'msg' not 'message'
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Send SMS using REST API with Bearer authentication
      const response = await fetch(`${this.baseUrl}/sendsms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
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
      if (response.ok && response.status === 200) {
        console.log('✅ SMS sent successfully via Voodoo SMS');
        
        // Mark as sent for deduplication
        this.markAsSent(data.to, data.message);
        
        // Extract message ID from response
        const messageId = result.messages?.[0]?.id || 
                         result.id || 
                         'voodoo_' + Date.now();
        
        return {
          success: true,
          messageId: messageId,
          credits: result.credits || 1,
          balance: result.balance,
        };
      }

      // Handle errors
      const errorMessage = result.error?.msg || 
                          result.error || 
                          response.statusText || 
                          'Unknown error';

      console.error('❌ SMS send failed:', errorMessage);
      return {
        success: false,
        error: `Failed to send SMS: ${errorMessage}`,
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
    const message = `Hi ${data.customerName}, your Speedy Van booking ${data.orderNumber} is confirmed! Pickup: ${data.pickupAddress} on ${data.scheduledDate}. We'll notify you when your driver is assigned. Call 01202129746 for support.`;

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
    const message = `Hi ${data.customerName}, payment of £${data.amount.toFixed(2)} received for booking ${data.orderNumber}. Thank you for choosing Speedy Van! Support: 01202129746`;

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
    const message = `Hi ${data.customerName}, your driver ${data.driverName} has been assigned to booking ${data.orderNumber}. Driver contact: ${data.driverPhone}. Speedy Van support: 01202129746`;

    return this.sendSMS({
      to: data.phoneNumber,
      message,
    });
  }

  /**
   * Check credit balance
   */
  async checkBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          balance: result.amount,
        };
      }

      return {
        success: false,
        error: 'Failed to check balance',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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

