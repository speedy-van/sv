import Pusher from 'pusher-js/react-native';
import Constants from 'expo-constants';
import { PusherEvent } from '../types';

const PUSHER_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_PUSHER_KEY || process.env.EXPO_PUBLIC_PUSHER_KEY || '';
const PUSHER_CLUSTER = Constants.expoConfig?.extra?.EXPO_PUBLIC_PUSHER_CLUSTER || process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'eu';

class PusherService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private broadcastChannel: any = null;
  private driverId: string | null = null;

  initialize(driverId: string): void {
    if (this.pusher && this.driverId === driverId) {
      console.log('Pusher already initialized for driver:', driverId);
      return;
    }

    try {
      console.log('🔌 Initializing Pusher for driver:', driverId);
      console.log('🔌 Pusher Key:', PUSHER_KEY?.substring(0, 10) + '...');
      console.log('🔌 Pusher Cluster:', PUSHER_CLUSTER);
      
      this.pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        forceTLS: true,
      });

      // Add connection state logging
      this.pusher.connection.bind('connected', () => {
        console.log('✅ Pusher connected successfully');
      });

      this.pusher.connection.bind('error', (err: any) => {
        console.error('❌ Pusher connection error:', err);
      });

      this.pusher.connection.bind('state_change', (states: any) => {
        console.log('🔄 Pusher state change:', states.previous, '->', states.current);
      });

      this.driverId = driverId;
      const channelName = `driver-${driverId}`;
      console.log('📡 Subscribing to channel:', channelName);
      
      this.channel = this.pusher.subscribe(channelName);
      
      // Add channel subscription logging
      this.channel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ Successfully subscribed to:', channelName);
      });

      this.channel.bind('pusher:subscription_error', (err: any) => {
        console.error('❌ Failed to subscribe to:', channelName, err);
      });
      
      // Subscribe to broadcast channel for all drivers
      this.broadcastChannel = this.pusher.subscribe('drivers-broadcast');
      
      this.broadcastChannel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ Successfully subscribed to: drivers-broadcast');
      });

      console.log('✅ Pusher initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Pusher:', error);
    }
  }

  disconnect(): void {
    if (this.pusher) {
      console.log('🔌 Disconnecting Pusher...');
      this.pusher.disconnect();
      this.pusher = null;
      this.channel = null;
      this.broadcastChannel = null;
      this.driverId = null;
    }
  }

  onRouteMatched(callback: (data: PusherEvent) => void): void {
    if (!this.channel) {
      console.warn('Pusher channel not initialized');
      return;
    }

    this.channel.bind('route-matched', (data: PusherEvent) => {
      console.log('🎯 ROUTE MATCHED:', data);
      callback(data);
    });
  }

  onJobAssigned(callback: (data: PusherEvent) => void): void {
    if (!this.channel) {
      console.warn('Pusher channel not initialized');
      return;
    }

    this.channel.bind('job-assigned', (data: PusherEvent) => {
      console.log('📦 JOB ASSIGNED:', data);
      callback(data);
    });
  }

  onRouteRemoved(callback: (data: PusherEvent) => void): void {
    if (!this.channel) {
      console.warn('Pusher channel not initialized');
      return;
    }

    this.channel.bind('route-removed', (data: PusherEvent) => {
      console.log('❌ ROUTE REMOVED:', data);
      callback(data);
    });
  }

  onRouteCancelled(callback: (data: PusherEvent) => void): void {
    if (!this.channel) {
      console.warn('Pusher channel not initialized');
      return;
    }

    this.channel.bind('route-cancelled', (data: PusherEvent) => {
      console.log('🚫 ROUTE CANCELLED:', data);
      callback(data);
    });
  }

  onDropRemoved(callback: (data: PusherEvent) => void): void {
    if (!this.channel) {
      console.warn('Pusher channel not initialized');
      return;
    }

    this.channel.bind('drop-removed', (data: PusherEvent) => {
      console.log('📦 DROP REMOVED:', data);
      callback(data);
    });
  }

  onNotification(callback: (data: PusherEvent) => void): void {
    if (!this.channel) {
      console.warn('Pusher channel not initialized');
      return;
    }

    this.channel.bind('notification', (data: PusherEvent) => {
      console.log('📬 NOTIFICATION:', data);
      callback(data);
    });
  }

  unbind(eventName: string): void {
    if (this.channel) {
      this.channel.unbind(eventName);
    }
  }

  unbindAll(): void {
    if (this.channel) {
      this.channel.unbind_all();
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.unbind_all();
    }
  }

  onJobRemoved(callback: (data: PusherEvent) => void): void {
    if (!this.broadcastChannel) {
      console.warn('Pusher broadcast channel not initialized');
      return;
    }

    this.broadcastChannel.bind('job-removed', (data: PusherEvent) => {
      console.log('🚫 JOB REMOVED (broadcast):', data);
      callback(data);
    });
  }

  // Listen for personal job removal (when admin removes driver from specific job)
  onPersonalJobRemoved(callback: (data: PusherEvent) => void): void {
    if (!this.channel) {
      console.warn('Pusher channel not initialized');
      return;
    }

    this.channel.bind('job-removed', (data: PusherEvent) => {
      console.log('❌ JOB REMOVED (personal):', data);
      callback(data);
    });
  }
}

export const pusherService = new PusherService();

