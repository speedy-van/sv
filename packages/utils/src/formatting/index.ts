/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format distance
 */
export function formatDistance(
  distance: number,
  unit: 'km' | 'mi' = 'km',
  decimals: number = 1
): string {
  return `${distance.toFixed(decimals)} ${unit}`;
}

/**
 * Format duration in minutes to human readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string, format: 'US' | 'international' = 'US'): string {
  const cleaned = phone.replace(/\D/g, '');

  if (format === 'US' && cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (format === 'US' && cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // International format
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  return phone; // Return original if can't format
}

/**
 * Format address for display
 */
export function formatAddress(address: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}): string {
  const { street, city, state, zipCode, country } = address;
  let formatted = `${street}, ${city}, ${state} ${zipCode}`;
  
  if (country && country !== 'US') {
    formatted += `, ${country}`;
  }

  return formatted;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(1)} ${sizes[i]}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format name for display (capitalize first letters)
 */
export function formatName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format tracking code
 */
export function formatTrackingCode(code: string): string {
  // Format as XXXX-XXXX-XXXX
  const cleaned = code.replace(/\W/g, '').toUpperCase();
  return cleaned.replace(/(.{4})/g, '$1-').slice(0, -1);
}

/**
 * Format weight
 */
export function formatWeight(
  weight: number,
  unit: 'kg' | 'lb' = 'kg',
  decimals: number = 1
): string {
  return `${weight.toFixed(decimals)} ${unit}`;
}

/**
 * Format dimensions
 */
export function formatDimensions(
  dimensions: { length: number; width: number; height: number },
  unit: 'cm' | 'in' = 'cm'
): string {
  const { length, width, height } = dimensions;
  return `${length} × ${width} × ${height} ${unit}`;
}

