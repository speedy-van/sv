/**
 * Currency utilities for Speedy Van
 */

export interface CurrencyAmount {
  amount: number;
  currency: string;
  formatted: string;
}

export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100); // Convert from pence to pounds
}

export function parseCurrency(amount: string): number {
  // Remove currency symbols and parse as pence
  const cleanAmount = amount.replace(/[£$€,]/g, '');
  return Math.round(parseFloat(cleanAmount) * 100);
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // Simple conversion rates (in production, use real-time rates)
  const rates: Record<string, number> = {
    GBP: 1,
    USD: 1.27,
    EUR: 1.17,
  };

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  return Math.round((amount / fromRate) * toRate);
}

export function createCurrencyAmount(amount: number, currency: string = 'GBP'): CurrencyAmount {
  return {
    amount,
    currency,
    formatted: formatCurrency(amount, currency),
  };
}

export function penceToPounds(pence: number): number {
  return pence / 100;
}

export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function validateBookingAmount(amount: number): boolean {
  return amount > 0 && amount <= 100000; // Max £1000
}

export function convertBookingAmountsToPence(amounts: Record<string, number>): Record<string, number> {
  const converted: Record<string, number> = {};
  for (const [key, value] of Object.entries(amounts)) {
    converted[key] = poundsToPence(value);
  }
  return converted;
}