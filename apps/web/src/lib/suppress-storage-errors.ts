/**
 * Suppress SecurityError exceptions from sessionStorage/localStorage access
 * This is needed when the app runs in contexts where storage is blocked
 * (e.g., iframes, sandboxed contexts, strict browser settings)
 */

if (typeof window !== 'undefined') {
  // Intercept and suppress storage-related SecurityErrors
  const originalErrorHandler = window.onerror;
  
  window.onerror = function(message, source, lineno, colno, error) {
    // Check if it's a storage SecurityError
    if (
      error instanceof Error &&
      error.name === 'SecurityError' &&
      (
        error.message.includes('sessionStorage') ||
        error.message.includes('localStorage') ||
        error.message.includes('Access is denied')
      )
    ) {
      // Log for debugging but don't show to user
      console.warn('Storage access blocked (expected in some contexts):', error.message);
      return true; // Prevent default error handling
    }
    
    // For other errors, use original handler or default behavior
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Also intercept unhandledrejection for Promise-based storage errors
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason instanceof Error &&
      event.reason.name === 'SecurityError' &&
      (
        event.reason.message.includes('sessionStorage') ||
        event.reason.message.includes('localStorage') ||
        event.reason.message.includes('Access is denied')
      )
    ) {
      console.warn('Storage access blocked (expected in some contexts):', event.reason.message);
      event.preventDefault(); // Prevent unhandled rejection error
    }
  });
}

export {};
