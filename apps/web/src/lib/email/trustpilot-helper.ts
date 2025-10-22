/**
 * Trustpilot Helper Functions
 * Generates Trustpilot review URLs and manages feedback collection
 */

export interface TrustpilotConfig {
  businessUnitId: string;
  baseUrl?: string;
  utmSource?: string;
  utmMedium?: string;
}

export interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  serviceType: string;
  totalAmount: number;
  currency: string;
  completedDate: string;
}

/**
 * Generate Trustpilot review URL
 */
export function generateTrustpilotUrl(
  businessUnitId: string,
  options: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
  } = {}
): string {
  const baseUrl = 'https://uk.trustpilot.com/review/speedy-van.co.uk';
  
  const params = new URLSearchParams({
    utm_medium: options.utmMedium || 'trustbox',
    utm_source: options.utmSource || 'TrustBoxReviewCollector',
    ...(options.utmCampaign && { utm_campaign: options.utmCampaign }),
    ...(options.utmContent && { utm_content: options.utmContent })
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate Trustpilot feedback data for email
 */
export function createTrustpilotFeedbackData(
  orderData: OrderData,
  config: TrustpilotConfig
) {
  const trustpilotUrl = generateTrustpilotUrl(config.businessUnitId, {
    utmSource: config.utmSource || 'email',
    utmMedium: config.utmMedium || 'trustbox',
    utmCampaign: 'post-service-feedback',
    utmContent: orderData.orderNumber
  });

  return {
    customerEmail: orderData.customerEmail,
    customerName: orderData.customerName,
    orderNumber: orderData.orderNumber,
    completedDate: orderData.completedDate,
    serviceType: orderData.serviceType,
    totalAmount: orderData.totalAmount,
    currency: orderData.currency,
    trustpilotUrl
  };
}

/**
 * Get Trustpilot configuration from environment
 */
export function getTrustpilotConfig(): TrustpilotConfig {
  return {
    businessUnitId: process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID || '68b0fc8a6ad677c356e83f14',
    baseUrl: 'https://uk.trustpilot.com/review/speedy-van.co.uk',
    utmSource: 'email',
    utmMedium: 'trustbox'
  };
}

/**
 * Send Trustpilot feedback email
 */
export async function sendTrustpilotFeedbackEmail(orderData: OrderData) {
  try {
    const { unifiedEmailService } = await import('./UnifiedEmailService');
    const config = getTrustpilotConfig();
    const feedbackData = createTrustpilotFeedbackData(orderData, config);
    
    console.log('📧 Sending Trustpilot feedback email to:', feedbackData.customerEmail);
    console.log('🔗 Trustpilot URL:', feedbackData.trustpilotUrl);
    
    return await unifiedEmailService.sendTrustpilotFeedback(feedbackData);
  } catch (error) {
    console.error('❌ Failed to send Trustpilot feedback email:', error);
    throw error;
  }
}

/**
 * Example usage:
 * 
 * const orderData = {
 *   orderNumber: 'SV-2024-001',
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   serviceType: 'Man and Van Service',
 *   totalAmount: 150.00,
 *   currency: 'GBP',
 *   completedDate: new Date().toISOString()
 * };
 * 
 * const result = await sendTrustpilotFeedbackEmail(orderData);
 * console.log('Email sent:', result.success);
 */
