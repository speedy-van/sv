'use client';

import Pusher from 'pusher-js';

// Singleton pattern to prevent multiple Pusher instances
class PusherSingleton {
  private static instance: Pusher | null = null;
  private static isConnecting = false;

  static getInstance(): Pusher | null {
    // Return existing instance if available and connected
    if (this.instance && this.instance.connection.state === 'connected') {
      return this.instance;
    }

    // Return existing instance if connecting to avoid duplicate connections
    if (this.instance && this.instance.connection.state === 'connecting') {
      console.log('🔄 Pusher connection already in progress...');
      return this.instance;
    }

    // Prevent multiple simultaneous connections
    if (this.isConnecting) {
      console.log('🔄 Pusher connection already in progress...');
      return null;
    }

    // Check if we're on client side
    if (typeof window === 'undefined') {
      console.warn('Pusher can only be initialized on client side');
      return null;
    }

    // Validate environment variables
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher credentials not found. Real-time features will be disabled.');
      return null;
    }

    if (typeof pusherKey !== 'string' || pusherKey.length === 0) {
      console.error('Invalid PUSHER_KEY environment variable');
      return null;
    }

    if (typeof pusherCluster !== 'string' || pusherCluster.length === 0) {
      console.error('Invalid PUSHER_CLUSTER environment variable');
      return null;
    }

    this.isConnecting = true;

    try {
      // Clean up existing instance if disconnected
      if (this.instance && this.instance.connection.state === 'disconnected') {
        this.instance.disconnect();
        this.instance = null;
      }

      // Create new Pusher instance with optimized configuration
      const pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
        enabledTransports: ['ws', 'wss'],
        disabledTransports: [],
        forceTLS: true,
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
        // Connection options to prevent premature disconnection
        activityTimeout: 30000, // 30 seconds
        pongTimeout: 6000, // 6 seconds
        unavailableTimeout: 10000, // 10 seconds
        // Additional options to handle React Strict Mode
        enableStats: false,
        statsHost: '',
        // Prevent connection issues in development
        ...(process.env.NODE_ENV === 'development' && {
          activityTimeout: 60000, // Longer timeout in dev
          pongTimeout: 10000,
        }),
      });

      // Add comprehensive connection event handlers
      pusher.connection.bind('connecting', () => {
        console.log('🔄 Pusher connecting...');
      });

      pusher.connection.bind('connected', () => {
        console.log('✅ Pusher connected successfully');
        this.isConnecting = false;
      });

      pusher.connection.bind('disconnected', () => {
        console.log('❌ Pusher disconnected');
        this.isConnecting = false;
      });

      pusher.connection.bind('error', (error: any) => {
        console.error('❌ Pusher connection error:', error);
        this.isConnecting = false;
        
        // Handle specific error types
        if (error?.type === 'WebSocketError') {
          console.error('WebSocket error - check network connectivity');
        } else if (error?.type === 'AuthError') {
          console.error('Authentication error - check Pusher credentials');
        } else if (error?.type === 'TransportError') {
          console.error('Transport error - check CORS and firewall settings');
        }
      });

      pusher.connection.bind('state_change', (states: any) => {
        console.log('🔄 Pusher state changed:', states.previous, '->', states.current);
      });

      this.instance = pusher;
      return pusher;

    } catch (error) {
      console.error('Failed to initialize Pusher:', error);
      this.isConnecting = false;
      return null;
    }
  }

  static disconnect(): void {
    if (this.instance) {
      try {
        this.instance.disconnect();
        console.log('🔌 Pusher disconnected');
      } catch (error) {
        console.error('Error disconnecting Pusher:', error);
      } finally {
        this.instance = null;
        this.isConnecting = false;
      }
    }
  }

  static getConnectionState(): string | null {
    return this.instance?.connection.state || null;
  }

  static isConnected(): boolean {
    return this.instance?.connection.state === 'connected';
  }

  // Clean up method for React Strict Mode
  static cleanup(): void {
    if (this.instance) {
      try {
        // Unbind all events to prevent memory leaks
        this.instance.connection.unbind_all();
        this.instance.disconnect();
        console.log('🧹 Pusher cleaned up for React Strict Mode');
      } catch (error) {
        console.error('Error during Pusher cleanup:', error);
      } finally {
        this.instance = null;
        this.isConnecting = false;
      }
    }
  }

  // Method to handle React Strict Mode double mounting
  static handleStrictMode(): void {
    if (process.env.NODE_ENV === 'development') {
      // In development, we might need to handle double mounting
      console.log('🔧 React Strict Mode detected - handling Pusher initialization');
    }
  }
}

export default PusherSingleton;
