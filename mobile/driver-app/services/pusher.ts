import Pusher from 'pusher-js/react-native';
import { PusherEvent } from '../types';

const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY || '';
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'eu';

class PusherService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private driverId: string | null = null;

  initialize(driverId: string): void {
    if (this.pusher && this.driverId === driverId) {
      console.log('Pusher already initialized for driver:', driverId);
      return;
    }

    try {
      console.log('🔌 Initializing Pusher for driver:', driverId);
      
      this.pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        forceTLS: true,
      });

      this.driverId = driverId;
      this.channel = this.pusher.subscribe(`driver-${driverId}`);

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
  }
}

export const pusherService = new PusherService();

