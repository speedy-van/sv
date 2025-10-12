import { useEffect, useState, useCallback, useRef } from 'react';
import {
  trackingService,
  TrackingData,
  RealTimeTrackingData,
  TrackingUpdate,
  RealTimeTrackingOptions,
} from '@/lib/tracking-service';

export interface UseRealTimeTrackingOptions extends RealTimeTrackingOptions {
  autoSubscribe?: boolean;
  refreshInterval?: number; // in milliseconds
  onUpdate?: (update: TrackingUpdate) => void;
  onLocationUpdate?: (location: any) => void;
  onStatusUpdate?: (status: any) => void;
  onProgressUpdate?: (progress: any) => void;
}

export interface UseRealTimeTrackingReturn {
  // Data
  trackingData: RealTimeTrackingData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  lookupBooking: (bookingCode: string) => Promise<RealTimeTrackingData | null>;
  subscribeToBooking: (bookingId: string) => void;
  unsubscribeFromBooking: (bookingId: string) => void;
  refreshData: () => Promise<void>;

  // Real-time updates
  lastUpdate: TrackingUpdate | null;
  connectionStatus: {
    isConnected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  };
}

export function useRealTimeTracking(
  options: UseRealTimeTrackingOptions = {}
): UseRealTimeTrackingReturn {
  const [trackingData, setTrackingData] = useState<RealTimeTrackingData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<TrackingUpdate | null>(null);

  const currentBookingId = useRef<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { autoSubscribe = true, refreshInterval = 30000 } = options;

  // Initialize connection status
  useEffect(() => {
    const updateConnectionStatus = () => {
      const status = trackingService.getConnectionStatus();
      setIsConnected(status.isConnected);
    };

    // Initial status
    updateConnectionStatus();

    // Set up connection monitoring
    const interval = setInterval(updateConnectionStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval && trackingData) {
      refreshIntervalRef.current = setInterval(() => {
        refreshData();
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [refreshInterval, trackingData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentBookingId.current) {
        trackingService.unsubscribeFromBooking(currentBookingId.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const lookupBooking = useCallback(
    async (bookingCode: string): Promise<RealTimeTrackingData | null> => {
      if (!bookingCode.trim()) {
        setError('Please enter a booking code');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await trackingService.lookupBooking(bookingCode, true);

        if (data) {
          setTrackingData(data);

          // Auto-subscribe to real-time updates if enabled
          if (autoSubscribe && data.id) {
            subscribeToBooking(data.id);
          }

          return data;
        } else {
          setError(
            'Booking not found. Please check your booking code and try again.'
          );
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to lookup booking';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [autoSubscribe]
  );

  const subscribeToBooking = useCallback(
    (bookingId: string) => {
      if (currentBookingId.current === bookingId) {
        return; // Already subscribed
      }

      // Unsubscribe from previous booking
      if (currentBookingId.current) {
        trackingService.unsubscribeFromBooking(currentBookingId.current);
      }

      currentBookingId.current = bookingId;

      trackingService.subscribeToBooking(bookingId, {
        onUpdate: (update: TrackingUpdate) => {
          setLastUpdate(update);

          // Update tracking data based on update type
          setTrackingData((prev: any) => {
            if (!prev) return prev;

            switch (update.type) {
              case 'location':
                return {
                  ...prev,
                  currentLocation: update.data,
                  lastUpdated: update.timestamp,
                };
              case 'status':
                return {
                  ...prev,
                  status: update.data.status,
                  lastUpdated: update.timestamp,
                };
              case 'progress':
                return {
                  ...prev,
                  routeProgress: update.data.progress,
                  lastUpdated: update.timestamp,
                };
              case 'eta':
                return {
                  ...prev,
                  eta: update.data,
                  lastUpdated: update.timestamp,
                };
              default:
                return prev;
            }
          });

          if (options.onUpdate) {
            options.onUpdate(update);
          }
        },
        onLocationUpdate: (location: any) => {
          if (options.onLocationUpdate) {
            options.onLocationUpdate(location);
          }
        },
        onStatusUpdate: (status: any) => {
          if (options.onStatusUpdate) {
            options.onStatusUpdate(status);
          }
        },
        onProgressUpdate: (progress: any) => {
          if (options.onProgressUpdate) {
            options.onProgressUpdate(progress);
          }
        },
      });
    },
    [options]
  );

  const unsubscribeFromBooking = useCallback((bookingId: string) => {
    trackingService.unsubscribeFromBooking(bookingId);
    if (currentBookingId.current === bookingId) {
      currentBookingId.current = null;
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (trackingData?.reference) {
      await lookupBooking(trackingData.reference);
    }
  }, [trackingData, lookupBooking]);

  return {
    // Data
    trackingData,
    isConnected,
    isLoading,
    error,

    // Actions
    lookupBooking,
    subscribeToBooking,
    unsubscribeFromBooking,
    refreshData,

    // Real-time updates
    lastUpdate,
    connectionStatus: trackingService.getConnectionStatus(),
  };
}

// Hook for admin tracking dashboard
export function useAdminRealTimeTracking(
  options: RealTimeTrackingOptions = {}
) {
  const [allBookings, setAllBookings] = useState<Record<string, TrackingData>>(
    {}
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateConnectionStatus = () => {
      const status = trackingService.getConnectionStatus();
      setIsConnected(status.isConnected);
    };

    updateConnectionStatus();
    const interval = setInterval(updateConnectionStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = trackingService.subscribeToAdminTracking({
      onUpdate: (update: TrackingUpdate) => {
        if (options.onUpdate) {
          options.onUpdate(update);
        }
      },
    });

    return () => {
      if (channel) {
        // Channel cleanup is handled by the service
      }
    };
  }, [options]);

  return {
    allBookings,
    isConnected,
    error,
    connectionStatus: trackingService.getConnectionStatus(),
  };
}
