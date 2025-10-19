/**
 * User-Friendly Error Messages
 * Converts technical errors into clear, actionable messages for drivers
 */

export const ErrorMessages = {
  // Job/Route Errors
  jobNotFound: {
    title: 'Job No Longer Available',
    message: 'This job offer has expired or been assigned to another driver.',
  },
  bookingNotFound: {
    title: 'Offer Expired',
    message: 'This offer is no longer available. Please check for new offers.',
  },
  jobAlreadyAccepted: {
    title: 'Already Accepted',
    message: 'You have already accepted this job.',
  },
  jobExpired: {
    title: 'Offer Expired',
    message: 'The time to respond to this offer has passed.',
  },

  // Network Errors
  networkError: {
    title: 'Connection Issue',
    message: 'Unable to connect. Please check your internet connection and try again.',
  },
  timeout: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
  },

  // Permission Errors
  locationPermissionDenied: {
    title: 'Location Access Required',
    message: 'Please enable location services in Settings to receive job offers.',
  },
  notificationPermissionDenied: {
    title: 'Notifications Disabled',
    message: 'Enable notifications in Settings to receive job alerts.',
  },

  // Authentication Errors
  unauthorized: {
    title: 'Session Expired',
    message: 'Please log in again to continue.',
  },
  forbidden: {
    title: 'Access Denied',
    message: 'You do not have permission to perform this action.',
  },

  // Server Errors
  serverError: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again in a moment.',
  },
  maintenanceMode: {
    title: 'Maintenance',
    message: 'The app is currently under maintenance. Please try again later.',
  },

  // Default
  unknown: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
};

/**
 * Get user-friendly error message from error code or message
 */
export function getUserFriendlyError(error: any): { title: string; message: string } {
  // Check for specific error codes
  if (error?.response?.status === 404) {
    if (error?.response?.data?.message?.includes('job')) {
      return ErrorMessages.jobNotFound;
    }
    if (error?.response?.data?.message?.includes('booking')) {
      return ErrorMessages.bookingNotFound;
    }
  }

  if (error?.response?.status === 401) {
    return ErrorMessages.unauthorized;
  }

  if (error?.response?.status === 403) {
    return ErrorMessages.forbidden;
  }

  if (error?.response?.status >= 500) {
    return ErrorMessages.serverError;
  }

  // Check for network errors
  if (error?.message?.includes('Network') || error?.code === 'ECONNABORTED') {
    return ErrorMessages.networkError;
  }

  if (error?.message?.includes('timeout')) {
    return ErrorMessages.timeout;
  }

  // Check for specific error messages
  if (error?.message?.includes('job ID not found') || error?.message?.includes('job not found')) {
    return ErrorMessages.jobNotFound;
  }

  if (error?.message?.includes('booking ID not found') || error?.message?.includes('booking not found')) {
    return ErrorMessages.bookingNotFound;
  }

  if (error?.message?.includes('expired')) {
    return ErrorMessages.jobExpired;
  }

  if (error?.message?.includes('already accepted')) {
    return ErrorMessages.jobAlreadyAccepted;
  }

  // Default error
  return ErrorMessages.unknown;
}

/**
 * Show user-friendly error alert
 */
export function showErrorAlert(error: any, customTitle?: string, customMessage?: string) {
  const { title, message } = getUserFriendlyError(error);
  
  // Use custom messages if provided
  const finalTitle = customTitle || title;
  const finalMessage = customMessage || message;

  return {
    title: finalTitle,
    message: finalMessage,
  };
}

export default {
  ErrorMessages,
  getUserFriendlyError,
  showErrorAlert,
};

