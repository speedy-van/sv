/**
 * Realtime channels configuration for Speedy Van
 */

export interface ChannelConfig {
  name: string;
  type: 'public' | 'private' | 'presence';
  events: string[];
}

export const REALTIME_CHANNELS = {
  // Public channels
  BOOKING_UPDATES: {
    name: 'booking-updates',
    type: 'public' as const,
    events: ['booking_created', 'booking_updated', 'booking_cancelled', 'booking_completed'],
  },
  
  // Private channels
  USER_NOTIFICATIONS: {
    name: 'user-notifications',
    type: 'private' as const,
    events: ['notification_received', 'message_received', 'status_update'],
  },
  
  DRIVER_NOTIFICATIONS: {
    name: 'driver-notifications',
    type: 'private' as const,
    events: ['job_assigned', 'job_updated', 'job_cancelled', 'payment_processed'],
  },
  
  ADMIN_NOTIFICATIONS: {
    name: 'admin-notifications',
    type: 'private' as const,
    events: ['system_alert', 'user_registered', 'driver_applied', 'payment_failed'],
  },
  
  // Presence channels
  DRIVER_LOCATION: {
    name: 'driver-location',
    type: 'presence' as const,
    events: ['location_update', 'status_change', 'availability_change'],
  },
  
  BOOKING_CHAT: {
    name: 'booking-chat',
    type: 'presence' as const,
    events: ['message_sent', 'typing_start', 'typing_stop', 'user_joined', 'user_left'],
  },
} as const;

export type ChannelName = keyof typeof REALTIME_CHANNELS;

export function getChannelConfig(channelName: ChannelName): ChannelConfig {
  const config = REALTIME_CHANNELS[channelName];
  return {
    name: config.name,
    type: config.type,
    events: [...config.events],
  };
}

export function getChannelEvents(channelName: ChannelName): string[] {
  return [...REALTIME_CHANNELS[channelName].events];
}

export function isChannelPublic(channelName: ChannelName): boolean {
  return REALTIME_CHANNELS[channelName].type === 'public';
}

export function isChannelPrivate(channelName: ChannelName): boolean {
  return REALTIME_CHANNELS[channelName].type === 'private';
}

export function isChannelPresence(channelName: ChannelName): boolean {
  return REALTIME_CHANNELS[channelName].type === 'presence';
}

export function generateChannelName(channelName: ChannelName, userId?: string): string {
  const config = REALTIME_CHANNELS[channelName];
  const baseName = config.name;
  
  if (config.type === 'public') {
    return baseName;
  }
  
  if (userId) {
    return `${baseName}-${userId}`;
  }
  
  return baseName;
}

export function validateChannelEvent(channelName: ChannelName, event: string): boolean {
  const allowedEvents = getChannelEvents(channelName);
  return allowedEvents.includes(event);
}

// Additional exports for realtime data hook
export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'error';

export const CHANNEL_NAMESPACES = {
  ORDERS: 'orders',
  DRIVERS: 'drivers',
  DISPATCH: 'dispatch',
  FINANCE: 'finance',
  ADMIN: 'admin',
} as const;

export const CHANNEL_EVENTS = {
  ORDER_UPDATED: 'order_updated',
  DRIVER_STATUS: 'driver_status',
  JOB_OFFERED: 'job_offered',
  PAYMENT_RECEIVED: 'payment_received',
} as const;

// Mock realtime manager for now
export const getRealtimeManager = (options: any = {}) => ({
  async initialize() {
    console.log('Initializing realtime manager');
  },
  
  async disconnect() {
    console.log('Disconnecting realtime manager');
  },

  subscribe(config: any, event: string, callback: (data: any) => void) {
    console.log('Subscribing to channel:', config, event);
    return () => console.log('Unsubscribed from channel');
  },

  onConnectionStateChange(callback: (state: ConnectionState) => void) {
    console.log('Connection state change listener added');
    return () => console.log('Connection state listener removed');
  },
});

export const initializeRealtime = async () => {
  console.log('Initializing realtime system');
};

export const realtimeUtils = {
  generateChannelName: (namespace: string, id?: string) => 
    id ? `${namespace}-${id}` : namespace,
  validateEvent: (event: string) => true,
};