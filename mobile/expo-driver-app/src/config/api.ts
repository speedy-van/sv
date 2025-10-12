// API Configuration
// Automatically detect the correct base URL for the environment
const getBaseURL = () => {
  // Check for explicit env variable first (for staging/production builds)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('📡 Using API URL from env:', envUrl);
    return envUrl;
  }
  
  // If running in development mode
  if (__DEV__) {
    // Use localhost for Expo Go (will work with tunneling)
    // Or change to your computer's IP if needed
    return process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:3000';
  }
  
  // Production URL - Main domain (backend is on main domain, not subdomain)
  return 'https://speedy-van.co.uk';
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 30000, // 30s for route operations
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1s initial delay, exponential backoff
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/driver/auth/login',
  SESSION: '/api/driver/session',
  
  // Driver
  PROFILE: '/api/driver/profile',
  AVAILABILITY: '/api/driver/availability',
  DASHBOARD: '/api/driver/dashboard',
  
  // Jobs
  JOBS: '/api/driver/jobs',
  JOB_DETAIL: (id: string) => `/api/driver/jobs/${id}`,
  ACCEPT_JOB: (id: string) => `/api/driver/jobs/${id}/accept`,
  DECLINE_JOB: (id: string) => `/api/driver/jobs/${id}/decline`,
  UPDATE_PROGRESS: (id: string) => `/api/driver/jobs/${id}/progress`,
  
  // Routes (Multi-Drop Routes)
  ROUTES: '/api/driver/routes',
  ROUTE_DETAIL: (id: string) => `/api/driver/routes/${id}`,
  ACCEPT_ROUTE: (id: string) => `/api/driver/routes/${id}/accept`,
  DECLINE_ROUTE: (id: string) => `/api/driver/routes/${id}/decline`,
  START_ROUTE: (id: string) => `/api/driver/routes/${id}/start`,
  COMPLETE_DROP: (routeId: string, dropId: string) => `/api/driver/routes/${routeId}/drops/${dropId}/complete`,
  
  // Schedule
  SCHEDULE: '/api/driver/schedule',
  
  // Earnings
  EARNINGS: '/api/driver/earnings',
  EARNINGS_SUMMARY: '/api/driver/earnings/summary',
  
  // Settings
  SETTINGS: '/api/driver/settings',
  UPDATE_PROFILE: '/api/driver/profile/update',
  UPDATE_NOTIFICATIONS: '/api/driver/notifications/update',
  UPDATE_VEHICLE: '/api/driver/vehicle/update',
  
  // Tracking
  SEND_LOCATION: '/api/driver/tracking',
};

// Company Information
export const COMPANY_INFO = {
  NAME: 'Speedy Van',
  SUPPORT_EMAIL: 'support@speedy-van.co.uk',
  SUPPORT_PHONE: '07901846297',
  ADDRESS: 'Office 2.18, 1 Barrack Street, Hamilton, ML3 0DG, Scotland',
};

// App Configuration
export const APP_CONFIG = {
  LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds
  LOCATION_DISTANCE_FILTER: 50, // 50 meters
};

