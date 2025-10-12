/**
 * Earnings Calculation Utilities
 * All calculations match backend logic exactly
 */

/**
 * Format earnings in pence to GBP string
 */
export function formatEarnings(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/**
 * Calculate partial earnings for incomplete routes
 * Based on completed drops only
 */
export function calculatePartialEarnings(
  totalEarningsPence: number,
  completedDrops: number,
  totalDrops: number
): number {
  if (totalDrops === 0) return 0;
  
  const perDropEarnings = totalEarningsPence / totalDrops;
  return Math.floor(perDropEarnings * completedDrops);
}

/**
 * Calculate total earnings from components
 */
export function calculateTotalEarnings(
  basePence: number,
  tipsPence: number = 0,
  bonusesPence: number = 0,
  deductionsPence: number = 0
): number {
  return basePence + tipsPence + bonusesPence - deductionsPence;
}

/**
 * Validate earnings match between mobile and backend
 * Allows 1 pence difference for rounding
 */
export function validateEarningsSync(
  mobileAmountPence: number,
  backendAmountPence: number
): boolean {
  return Math.abs(mobileAmountPence - backendAmountPence) <= 1;
}

/**
 * Convert pence to pounds (number)
 */
export function penceToGBP(pence: number): number {
  return pence / 100;
}

/**
 * Convert pounds to pence (number)
 */
export function gbpToPence(gbp: number): number {
  return Math.round(gbp * 100);
}

/**
 * Format earnings breakdown
 */
export function formatEarningsBreakdown(earning: {
  basePence: number;
  tipsPence?: number;
  bonusesPence?: number;
  deductionsPence?: number;
}): string {
  const parts: string[] = [];
  
  parts.push(`Base: ${formatEarnings(earning.basePence)}`);
  
  if (earning.tipsPence && earning.tipsPence > 0) {
    parts.push(`Tips: ${formatEarnings(earning.tipsPence)}`);
  }
  
  if (earning.bonusesPence && earning.bonusesPence > 0) {
    parts.push(`Bonuses: ${formatEarnings(earning.bonusesPence)}`);
  }
  
  if (earning.deductionsPence && earning.deductionsPence > 0) {
    parts.push(`Deductions: -${formatEarnings(earning.deductionsPence)}`);
  }
  
  return parts.join(' + ');
}

/**
 * Get earnings color based on amount
 */
export function getEarningsColor(pence: number): string {
  if (pence >= 5000) return '#10B981'; // Green: £50+
  if (pence >= 3000) return '#3B82F6'; // Blue: £30+
  if (pence >= 1000) return '#F59E0B'; // Orange: £10+
  return '#6B7280'; // Gray: < £10
}

/**
 * Calculate acceptance rate change impact
 */
export function calculateAcceptanceRateChange(
  currentRate: number,
  declines: number
): number {
  return Math.max(0, currentRate - (declines * 5));
}

/**
 * Get acceptance rate status
 */
export function getAcceptanceRateStatus(rate: number): {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  color: string;
  message: string;
} {
  if (rate >= 90) {
    return {
      status: 'excellent',
      color: '#10B981',
      message: 'Excellent! Keep it up!'
    };
  }
  if (rate >= 80) {
    return {
      status: 'good',
      color: '#3B82F6',
      message: 'Good performance'
    };
  }
  if (rate >= 60) {
    return {
      status: 'fair',
      color: '#F59E0B',
      message: 'Fair - Try to accept more jobs'
    };
  }
  if (rate >= 40) {
    return {
      status: 'poor',
      color: '#EF4444',
      message: 'Poor - Acceptance rate is low'
    };
  }
  return {
    status: 'critical',
    color: '#DC2626',
    message: 'Critical - Account review needed'
  };
}

