/**
 * Pusher configuration for real-time features
 */

import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance (with fallback for build time)
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'build-placeholder',
  key: process.env.PUSHER_KEY || 'build-placeholder',
  secret: process.env.PUSHER_SECRET || 'build-placeholder',
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

// Client-side Pusher instance (for use in components) - with fallback for build time
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || 'build-placeholder',
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
    forceTLS: true,
  }
);

export interface PusherChannel {
  name: string;
  events: string[];
}

export const PUSHER_CHANNELS = {
  BOOKING: 'booking',
  DRIVER_STATUS: 'driver-status',
  ADMIN_UPDATES: 'admin-updates',
  CUSTOMER_UPDATES: 'customer-updates',
  SYSTEM_ALERTS: 'system-alerts',
} as const;

export const PUSHER_EVENTS = {
  TRACKING_UPDATE: 'tracking_update',
  ETA_UPDATE: 'eta_update',
  JOB_STATUS_UPDATE: 'job_status_update',
  DRIVER_STATUS_UPDATE: 'status_update',
  ADMIN_NOTIFICATION: 'admin_notification',
  SYSTEM_ALERT: 'system_alert',
  MESSAGE_RECEIVED: 'message_received',
} as const;

export function getChannelName(type: keyof typeof PUSHER_CHANNELS, id?: string): string {
  const baseChannel = PUSHER_CHANNELS[type];
  return id ? `${baseChannel}-${id}` : baseChannel;
}

export function authenticateChannel(
  socketId: string,
  channel: string,
  userId?: string,
  userInfo?: any
): { auth: string } {
  const authResponse = pusher.authenticate(socketId, channel, {
    user_id: userId || 'anonymous',
    user_info: userInfo,
  });
  
  return { auth: authResponse.auth };
}

export function isAuthorizedForChannel(
  channel: string,
  userId: string,
  userRole: string
): boolean {
  // Allow driver-specific channels for drivers and admins
  if (channel.startsWith('driver-')) {
    return userRole === 'driver' || userRole === 'admin';
  }
  
  // Basic authorization logic
  if (channel.startsWith('booking-')) {
    return true; // Allow all authenticated users to subscribe to booking updates
  }
  
  if (channel === 'admin-updates') {
    return userRole === 'admin';
  }
  
  if (channel === 'driver-status') {
    return userRole === 'driver' || userRole === 'admin';
  }
  
  return true; // Default allow
}

export default pusher;