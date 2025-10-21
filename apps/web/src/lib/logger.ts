// Production-safe logger that removes console logs in production
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors, but only in development show full details
    if (isDevelopment) {
      console.error(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

// Suppress console in production
if (typeof window !== 'undefined' && !isDevelopment) {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  // Keep console.error for critical issues but make it silent
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Only log to error tracking service, not to console
    if (typeof window !== 'undefined' && (window as any).errorTracker) {
      (window as any).errorTracker.captureException(args);
    }
  };
}

// Default export for compatibility
export default logger;
