/**
 * Real-time tracking service
 */

import { pusher } from './realtime/pusher-config';

export interface TrackingLocation {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface TrackingUpdate {
  bookingId: string;
  driverId: string;
  location: TrackingLocation;
  status: 'en_route' | 'arrived' | 'loading' | 'unloading' | 'completed';
  eta?: number; // minutes
  message?: string;
  type: 'location' | 'status' | 'progress' | 'eta';
  data: any;
  timestamp: Date;
}

export interface DriverStatus {
  driverId: string;
  status: 'online' | 'offline' | 'busy' | 'available';
  location?: TrackingLocation;
  lastSeen: Date;
}

export interface Address {
  street: string;
  city: string;
  postcode: string;
  coordinates: [number, number];
}

export interface BookingProperties {
  items: Array<{
    name: string;
    quantity: number;
    category: string;
  }>;
  serviceType: string;
  estimatedDuration: number;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  rating: number;
}

export interface TrackingData {
  id: string;
  reference: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  unifiedBookingId: string;
  pickupAddress: Address;
  dropoffAddress: Address;
  properties: BookingProperties;
  driver: DriverInfo;
  estimatedArrival?: Date;
  actualArrival?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUpdated?: Date;
  currentLocation?: TrackingLocation;
  routeProgress?: number;
  eta?: number;
}

export async function sendTrackingUpdate(update: TrackingUpdate): Promise<void> {
  try {
    await pusher.trigger(
      `booking-${update.bookingId}`,
      'tracking_update',
      {
        ...update,
        timestamp: update.location.timestamp.toISOString(),
      }
    );
  } catch (error) {
    console.error('Failed to send tracking update:', error);
    throw new Error('Failed to send tracking update');
  }
}

export async function sendDriverStatus(status: DriverStatus): Promise<void> {
  try {
    await pusher.trigger(
      'driver-status',
      'status_update',
      {
        ...status,
        lastSeen: status.lastSeen.toISOString(),
        location: status.location ? {
          ...status.location,
          timestamp: status.location.timestamp.toISOString(),
        } : undefined,
      }
    );
  } catch (error) {
    console.error('Failed to send driver status:', error);
    throw new Error('Failed to send driver status');
  }
}

export async function sendETAUpdate(
  bookingId: string,
  eta: number,
  driverId: string
): Promise<void> {
  try {
    await pusher.trigger(
      `booking-${bookingId}`,
      'eta_update',
      {
        bookingId,
        driverId,
        eta,
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Failed to send ETA update:', error);
    throw new Error('Failed to send ETA update');
  }
}

export async function sendJobStatusUpdate(
  bookingId: string,
  status: string,
  message?: string
): Promise<void> {
  try {
    await pusher.trigger(
      `booking-${bookingId}`,
      'job_status_update',
      {
        bookingId,
        status,
        message,
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Failed to send job status update:', error);
    throw new Error('Failed to send job status update');
  }
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function calculateETA(
  distance: number, // in kilometers
  averageSpeed: number = 50 // km/h
): number {
  return Math.round((distance / averageSpeed) * 60); // minutes
}

// Additional interfaces and types for realtime tracking hook
export interface RealTimeTrackingData {
  id: string;
  reference: string;
  status: string;
  currentLocation?: TrackingLocation;
  routeProgress?: number;
  eta?: number;
  lastUpdated?: Date;
}

export interface RealTimeTrackingOptions {
  onUpdate?: (update: TrackingUpdate) => void;
  onLocationUpdate?: (location: TrackingLocation) => void;
  onStatusUpdate?: (status: string) => void;
  onProgressUpdate?: (progress: number) => void;
}

// Real tracking service implementation
let pusherClient: any = null;
let channels: Map<string, any> = new Map();

// Initialize Pusher client
function getPusherClient() {
  if (!pusherClient && typeof window !== 'undefined') {
    const Pusher = require('pusher-js');
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });
  }
  return pusherClient;
}

export const trackingService = {
  async lookupBooking(bookingCode: string, enableRealtime: boolean = false): Promise<RealTimeTrackingData | null> {
    try {
      const response = await fetch(`/api/track/${bookingCode}?tracking=true&realtime=${enableRealtime}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return {
        id: data.id,
        reference: data.reference,
        status: data.status,
        currentLocation: data.currentLocation,
        routeProgress: data.routeProgress,
        eta: data.eta,
        lastUpdated: new Date(data.lastUpdated),
      };
    } catch (error) {
      console.error('Error looking up booking:', error);
      return null;
    }
  },

  subscribeToBooking(bookingId: string, options: RealTimeTrackingOptions) {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `tracking-${bookingId}`;
    
    if (channels.has(channelName)) {
      return; // Already subscribed
    }

    const channel = pusher.subscribe(channelName);
    channels.set(channelName, channel);

    // Bind to progress update events
    channel.bind('progress-update', (data: any) => {
      const update: TrackingUpdate = {
        bookingId: data.bookingId,
        driverId: data.driverId,
        location: {
          lat: 0,
          lng: 0,
          timestamp: new Date(),
        },
        status: data.status as any,
        type: 'progress',
        data: {
          progress: data.progress,
          step: data.step,
          stepLabel: data.stepLabel,
          message: data.message,
        },
        timestamp: new Date(data.timestamp),
      };

      if (options.onUpdate) {
        options.onUpdate(update);
      }
      if (options.onProgressUpdate) {
        options.onProgressUpdate(data.progress);
      }
    });

    // Bind to job status update events
    channel.bind('job-status-update', (data: any) => {
      const update: TrackingUpdate = {
        bookingId: data.bookingId,
        driverId: data.driverId,
        location: {
          lat: 0,
          lng: 0,
          timestamp: new Date(),
        },
        status: data.status as any,
        type: 'status',
        data: {
          status: data.status,
          step: data.step,
          stepLabel: data.stepLabel,
          message: data.message,
        },
        timestamp: new Date(data.timestamp),
      };

      if (options.onUpdate) {
        options.onUpdate(update);
      }
      if (options.onStatusUpdate) {
        options.onStatusUpdate(data.status);
      }
    });

    // Bind to location update events
    channel.bind('location-update', (data: any) => {
      const update: TrackingUpdate = {
        bookingId: data.bookingId,
        driverId: data.driverId,
        location: {
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date(data.timestamp),
          accuracy: data.accuracy,
        },
        status: 'en_route',
        type: 'location',
        data: {
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy,
        },
        timestamp: new Date(data.timestamp),
      };

      if (options.onUpdate) {
        options.onUpdate(update);
      }
      if (options.onLocationUpdate) {
        options.onLocationUpdate(update.location);
      }
    });

    console.log('✅ Subscribed to booking tracking:', channelName);
  },

  unsubscribeFromBooking(bookingId: string) {
    const channelName = `tracking-${bookingId}`;
    const channel = channels.get(channelName);
    
    if (channel) {
      channel.unsubscribe();
      channels.delete(channelName);
      console.log('✅ Unsubscribed from booking tracking:', channelName);
    }
  },

  subscribeToAdminTracking(options: RealTimeTrackingOptions) {
    const pusher = getPusherClient();
    if (!pusher) return null;

    const channelName = 'admin-tracking';
    
    if (channels.has(channelName)) {
      return channels.get(channelName);
    }

    const channel = pusher.subscribe(channelName);
    channels.set(channelName, channel);

    console.log('✅ Subscribing to admin tracking channel:', channelName);

    // Bind to location update events (CRITICAL - this was missing!)
    channel.bind('location-update', (data: any) => {
      console.log('📍 Admin tracking received location update:', data);
      if (options.onUpdate) {
        const update: TrackingUpdate = {
          bookingId: data.bookingId,
          driverId: data.driverId,
          location: {
            lat: data.lat,
            lng: data.lng,
            timestamp: new Date(data.timestamp),
            accuracy: data.accuracy,
          },
          status: 'en_route',
          type: 'location',
          data: {
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy,
            bookingReference: data.bookingReference,
            customerName: data.customerName,
          },
          timestamp: new Date(data.timestamp),
        };
        options.onUpdate(update);
      }
      if (options.onLocationUpdate) {
        options.onLocationUpdate({
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date(data.timestamp),
          accuracy: data.accuracy,
        });
      }
    });

    // Bind to progress update events
    channel.bind('progress-update', (data: any) => {
      console.log('📈 Admin tracking received progress update:', data);
      if (options.onUpdate) {
        const update: TrackingUpdate = {
          bookingId: data.bookingId,
          driverId: data.driverId,
          location: {
            lat: 0,
            lng: 0,
            timestamp: new Date(),
          },
          status: 'en_route',
          type: 'progress',
          data: {
            progress: data.progress,
            step: data.step,
            stepLabel: data.stepLabel,
            customerName: data.customerName,
          },
          timestamp: new Date(data.timestamp),
        };
        options.onUpdate(update);
      }
      if (options.onProgressUpdate) {
        options.onProgressUpdate(data.progress);
      }
    });

    // Bind to diagnostic test events
    channel.bind('diagnostic-test', (data: any) => {
      console.log('🔍 Admin tracking received diagnostic test:', data);
    });

    // Bind to test update events
    channel.bind('test-update', (data: any) => {
      console.log('🧪 Admin tracking received test update:', data);
    });

    console.log('✅ Successfully subscribed to admin tracking with all event handlers');
    return channel;
  },

  getConnectionStatus() {
    const pusher = getPusherClient();
    return {
      isConnected: pusher ? pusher.connection.state === 'connected' : false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
    };
  },
};