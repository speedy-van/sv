import { format, formatDistanceToNow, isAfter, isBefore, addHours, addDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Format date for display
 */
export function formatDate(date: Date, formatString: string = 'MMM dd, yyyy'): string {
  return format(date, formatString);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date, formatString: string = 'MMM dd, yyyy HH:mm'): string {
  return format(date, formatString);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: Date): boolean {
  return isAfter(date, new Date());
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date): boolean {
  return isBefore(date, new Date());
}

/**
 * Get business hours for a given date
 */
export function getBusinessHours(
  date: Date,
  hours: { start: number; end: number } = { start: 9, end: 18 }
): { start: Date; end: Date } {
  const startOfBusinessDay = new Date(date);
  startOfBusinessDay.setHours(hours.start, 0, 0, 0);

  const endOfBusinessDay = new Date(date);
  endOfBusinessDay.setHours(hours.end, 0, 0, 0);

  return {
    start: startOfBusinessDay,
    end: endOfBusinessDay,
  };
}

/**
 * Check if date is within business hours
 */
export function isBusinessHours(
  date: Date,
  hours: { start: number; end: number } = { start: 9, end: 18 }
): boolean {
  const businessHours = getBusinessHours(date, hours);
  return isAfter(date, businessHours.start) && isBefore(date, businessHours.end);
}

/**
 * Get next business day
 */
export function getNextBusinessDay(date: Date): Date {
  let nextDay = addDays(date, 1);
  
  // Skip weekends (Saturday = 6, Sunday = 0)
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay = addDays(nextDay, 1);
  }
  
  return nextDay;
}

/**
 * Calculate estimated delivery time
 */
export function calculateEstimatedDelivery(
  scheduledDate: Date,
  estimatedDurationMinutes: number
): Date {
  return addHours(scheduledDate, estimatedDurationMinutes / 60);
}

/**
 * Get available time slots for a given date
 */
export function getAvailableTimeSlots(
  date: Date,
  slotDurationMinutes: number = 60,
  businessHours: { start: number; end: number } = { start: 9, end: 18 }
): Date[] {
  const slots: Date[] = [];
  const { start, end } = getBusinessHours(date, businessHours);
  
  let currentSlot = new Date(start);
  
  while (isBefore(currentSlot, end)) {
    slots.push(new Date(currentSlot));
    currentSlot = addHours(currentSlot, slotDurationMinutes / 60);
  }
  
  return slots;
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get start and end of day
 */
export function getDayBounds(date: Date): { start: Date; end: Date } {
  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

/**
 * Convert minutes to hours and minutes
 */
export function minutesToHoursAndMinutes(minutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return { hours, minutes: remainingMinutes };
}

/**
 * Get timezone offset string
 */
export function getTimezoneOffset(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset <= 0 ? '+' : '-';
  
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

