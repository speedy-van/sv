import { useEffect, useState, useRef } from 'react';
import Pusher, { Channel } from 'pusher-js';

interface TrackingUpdate {
  bookingId: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
  eta?: {
    estimatedArrival: string;
    minutesRemaining: number;
  };
  routeProgress?: number;
}

interface UseTrackingUpdatesOptions {
  bookingId?: string;
  enabled?: boolean;
  onUpdate?: (update: TrackingUpdate) => void;
}

export function useTrackingUpdates({
  bookingId,
  enabled = true,
  onUpdate,
}: UseTrackingUpdatesOptions = {}) {
  const [updates, setUpdates] = useState<TrackingUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initialize Pusher
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });

      pusherRef.current.connection.bind('connected', () => {
        setIsConnected(true);
        setError(null);
      });

      pusherRef.current.connection.bind('disconnected', () => {
        setIsConnected(false);
      });

      pusherRef.current.connection.bind('error', (err: any) => {
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);
      });
    }

    // Subscribe to tracking channel
    const channelName = bookingId
      ? `private-tracking-${bookingId}`
      : 'private-tracking-updates';

    if (!channelRef.current) {
      channelRef.current = pusherRef.current.subscribe(channelName);

      channelRef.current.bind('location-update', (data: TrackingUpdate) => {
        setUpdates(prev => {
          const newUpdates = [...prev, data];
          // Keep only last 50 updates
          return newUpdates.slice(-50);
        });

        if (onUpdate) {
          onUpdate(data);
        }
      });

      channelRef.current.bind('status-update', (data: any) => {
        if (onUpdate) {
          onUpdate(data);
        }
      });

      channelRef.current.bind('subscription_succeeded', () => {
        console.log('Successfully subscribed to tracking channel');
      });

      channelRef.current.bind('subscription_error', (err: any) => {
        setError(`Subscription error: ${err.message}`);
      });
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [bookingId, enabled, onUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

  const sendLocationUpdate = async (
    lat: number,
    lng: number,
    bookingId: string
  ) => {
    try {
      const response = await fetch('/api/driver/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send location update');
      }

      return await response.json();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send location update'
      );
      throw err;
    }
  };

  const getLatestUpdate = () => {
    return updates.length > 0 ? updates[updates.length - 1] : null;
  };

  const clearUpdates = () => {
    setUpdates([]);
  };

  return {
    updates,
    latestUpdate: getLatestUpdate(),
    isConnected,
    error,
    sendLocationUpdate,
    clearUpdates,
  };
}

// Hook for admin tracking dashboard
export function useAdminTrackingUpdates() {
  const [allUpdates, setAllUpdates] = useState<
    Record<string, TrackingUpdate[]>
  >({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    // Initialize Pusher for admin
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });

      pusherRef.current.connection.bind('connected', () => {
        setIsConnected(true);
        setError(null);
      });

      pusherRef.current.connection.bind('disconnected', () => {
        setIsConnected(false);
      });

      pusherRef.current.connection.bind('error', (err: any) => {
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);
      });
    }

    // Subscribe to admin tracking channel
    if (!channelRef.current) {
      channelRef.current = pusherRef.current.subscribe(
        'private-admin-tracking'
      );

      channelRef.current.bind('location-update', (data: TrackingUpdate) => {
        setAllUpdates(prev => {
          const bookingUpdates = prev[data.bookingId] || [];
          const newUpdates = [...bookingUpdates, data];
          // Keep only last 20 updates per booking
          return {
            ...prev,
            [data.bookingId]: newUpdates.slice(-20),
          };
        });
      });

      channelRef.current.bind('booking-status-update', (data: any) => {
        // Handle booking status changes
        console.log('Booking status update:', data);
      });

      channelRef.current.bind('subscription_succeeded', () => {
        console.log('Successfully subscribed to admin tracking channel');
      });

      channelRef.current.bind('subscription_error', (err: any) => {
        setError(`Subscription error: ${err.message}`);
      });
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

  const getBookingUpdates = (bookingId: string) => {
    return allUpdates[bookingId] || [];
  };

  const getLatestBookingUpdate = (bookingId: string) => {
    const updates = getBookingUpdates(bookingId);
    return updates.length > 0 ? updates[updates.length - 1] : null;
  };

  const getAllLatestUpdates = () => {
    const latest: Record<string, TrackingUpdate> = {};
    Object.keys(allUpdates).forEach(bookingId => {
      const update = getLatestBookingUpdate(bookingId);
      if (update) {
        latest[bookingId] = update;
      }
    });
    return latest;
  };

  return {
    allUpdates,
    getBookingUpdates,
    getLatestBookingUpdate,
    getAllLatestUpdates,
    isConnected,
    error,
  };
}
