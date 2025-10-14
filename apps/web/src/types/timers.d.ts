/**
 * Timer types for cross-platform compatibility
 * Fixes TS2322: Type 'number' is not assignable to type 'Timeout'
 */

declare global {
  // Use ReturnType to get the actual return type of setTimeout
  type TimeoutId = ReturnType<typeof setTimeout>;
  type IntervalId = ReturnType<typeof setInterval>;
  
  // For legacy code that expects number
  type TimerId = NodeJS.Timeout | number;
}

export {};

