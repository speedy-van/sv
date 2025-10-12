/**
 * Date utilities for consistent handling of dates across the application
 */

/**
 * Parse various date formats into a Date object
 * @param dateInput - Date string, Date object, or timestamp
 * @returns Date object or null if invalid
 */
export function parseDate(dateInput: string | Date | number | null | undefined): Date | null {
  if (!dateInput) {
    return null;
  }

  let date: Date;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (typeof dateInput === 'string') {
    // Handle various string formats
    date = new Date(dateInput);
  } else {
    return null;
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Format date for database storage (ISO string)
 * @param date - Date to format
 * @returns ISO string or null
 */
export function formatDateForDatabase(date: Date | string | null | undefined): string | null {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return null;
  }
  
  return parsedDate.toISOString();
}

/**
 * Format date for frontend display
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDateForDisplay(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat('en-GB', options).format(parsedDate);
}

/**
 * Validate that a date is in the future
 * @param date - Date to validate
 * @returns true if valid future date, false otherwise
 */
export function isFutureDate(date: Date | string | null | undefined): boolean {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return false;
  }

  const now = new Date();
  return parsedDate > now;
}

/**
 * Validate that a date is within a reasonable booking range (next 2 years)
 * @param date - Date to validate
 * @returns true if within range, false otherwise
 */
export function isValidBookingDate(date: Date | string | null | undefined): boolean {
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return false;
  }

  const now = new Date();
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(now.getFullYear() + 2);

  return parsedDate > now && parsedDate <= twoYearsFromNow;
}

/**
 * Convert time string to minutes since midnight
 * @param timeString - Time in HH:MM format
 * @returns Minutes since midnight, or null if invalid
 */
export function timeStringToMinutes(timeString: string | null | undefined): number | null {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }

  const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) {
    return null;
  }

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 * @param minutes - Minutes since midnight
 * @returns Time string in HH:MM format
 */
export function minutesToTimeString(minutes: number): string {
  if (typeof minutes !== 'number' || minutes < 0 || minutes >= 1440) {
    return '00:00';
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get UK business hours validation
 * @param timeString - Time in HH:MM format
 * @returns true if within business hours (8:00-18:00), false otherwise
 */
export function isBusinessHours(timeString: string | null | undefined): boolean {
  const minutes = timeStringToMinutes(timeString);
  if (minutes === null) {
    return false;
  }

  // Business hours: 8:00 AM (480 minutes) to 6:00 PM (1080 minutes)
  return minutes >= 480 && minutes <= 1080;
}

/**
 * Combine date and time strings into a single Date object
 * @param dateString - Date string (YYYY-MM-DD)
 * @param timeString - Time string (HH:MM)
 * @returns Combined Date object or null if invalid
 */
export function combineDateAndTime(
  dateString: string | null | undefined,
  timeString: string | null | undefined
): Date | null {
  if (!dateString || !timeString) {
    return null;
  }

  const date = parseDate(dateString);
  if (!date) {
    return null;
  }

  const minutes = timeStringToMinutes(timeString);
  if (minutes === null) {
    return null;
  }

  const combined = new Date(date);
  combined.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

  return combined;
}

/**
 * Get the start and end of a day in UK timezone
 * @param date - Date to get day boundaries for
 * @returns Object with start and end Date objects
 */
export function getDayBoundaries(date: Date | string): { start: Date; end: Date } {
  const parsedDate = parseDate(date) || new Date();
  
  const start = new Date(parsedDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(parsedDate);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}
