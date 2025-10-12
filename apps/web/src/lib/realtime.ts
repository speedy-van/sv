'use client';
import { useEffect, useRef } from 'react';
import { createPusherClient } from './pusher-client';

interface RealtimeConfig {
  driverId: string;
  onOfferReceived?: (offer: any) => void;
  onJobStatusChanged?: (jobId: string, status: string) => void;
  onAdminMessage?: (message: any) => void;
  onLocationUpdate?: (location: any) => void;
  onNotificationReceived?: (notification: any) => void;
}

export function useRealtime(config: RealtimeConfig) {
  const pusherRef = useRef<any>(null);
  const channelsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (!config.driverId) return;

    const init = async () => {
      try {
        // Initialize Pusher with better error handling
        const pusher = await createPusherClient({
          authEndpoint: '/api/pusher/auth',
          auth: {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        });

        // Add connection event handlers
        pusher.connection.bind('connected', () => {
          console.log('Pusher connected successfully');
        });

        pusher.connection.bind('error', (err: any) => {
          console.error('Pusher connection error:', err);
        });

        pusher.connection.bind('disconnected', () => {
          console.log('Pusher disconnected');
        });

        pusher.connection.bind('reconnecting', () => {
          console.log('Pusher reconnecting...');
        });

        pusherRef.current = pusher;

        // Subscribe to driver-specific channel
        const driverChannel = pusher.subscribe(`driver-${config.driverId}`);
        channelsRef.current.set('driver', driverChannel);

        // Subscribe to job channels (will be added dynamically)
        const jobChannels = new Set<string>();
        channelsRef.current.set('jobs', jobChannels);

        // Handle driver channel events
        driverChannel.bind('offer', (data: any) => {
          config.onOfferReceived?.(data);
        });

        driverChannel.bind('admin_message', (data: any) => {
          config.onAdminMessage?.(data);
        });

        driverChannel.bind('job_reassigned', (data: any) => {
          config.onJobStatusChanged?.(data.jobId, 'reassigned');
        });

        driverChannel.bind('notification', (data: any) => {
          config.onNotificationReceived?.(data);
        });
      } catch (error) {
        console.error('Failed to initialize Pusher:', error);
        return;
      }
    };
    init();

    return () => {
      // Cleanup
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      channelsRef.current.clear();
    };
  }, [config.driverId]);

  // Function to subscribe to job-specific channels
  const subscribeToJob = (jobId: string) => {
    if (!pusherRef.current) return;

    const jobChannel = pusherRef.current.subscribe(`job-${jobId}`);
    const jobChannels = channelsRef.current.get('jobs') as Set<string>;
    jobChannels.add(jobId);

    jobChannel.bind('status', (data: any) => {
      config.onJobStatusChanged?.(jobId, data.to);
    });

    jobChannel.bind('location', (data: any) => {
      config.onLocationUpdate?.(data);
    });

    jobChannel.bind('chat', (data: any) => {
      // Handle chat messages
    });
  };

  // Function to unsubscribe from job channels
  const unsubscribeFromJob = (jobId: string) => {
    if (!pusherRef.current) return;

    const jobChannels = channelsRef.current.get('jobs') as Set<string>;
    if (jobChannels.has(jobId)) {
      pusherRef.current.unsubscribe(`job-${jobId}`);
      jobChannels.delete(jobId);
    }
  };

  return {
    subscribeToJob,
    unsubscribeFromJob,
  };
}
