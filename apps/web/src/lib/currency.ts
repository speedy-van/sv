export function formatCurrency(
  totalGBP: number,
  currency: string = 'GBP'
): string {
  const pounds = totalGBP / 100;

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pounds);
}

export function formatCurrencyShort(
  totalGBP: number,
  currency: string = 'GBP'
): string {
  const pounds = totalGBP / 100;

  if (pounds >= 1000) {
    return `£${(pounds / 1000).toFixed(1)}k`;
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pounds);
}

export function parseCurrency(amount: string): number {
  // Remove currency symbols and commas, then convert to pence
  const cleanAmount = amount.replace(/[£,]/g, '');
  const pounds = parseFloat(cleanAmount);
  return Math.round(pounds * 100);
}
