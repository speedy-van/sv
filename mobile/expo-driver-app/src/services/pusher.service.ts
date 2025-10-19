// Import pusher-js react-native entrypoint in a resilient way to handle
// both CommonJS and ESM shapes. Some pusher-js releases change their
// default/namespace export which can cause "Cannot read property 'default' of undefined".
import * as PusherModule from 'pusher-js/react-native';
const Pusher: any = (PusherModule as any)?.default || PusherModule;
import { Platform } from 'react-native';
import audioService from './audio.service';
import notificationService from './notification.service';
import { API_CONFIG } from '../config/api';
import { getToken } from './storage.service';

// Pusher configuration
const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY || '407cb06c423e6c032e9c';
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'eu';

class PusherService {
  // Use `any` for the instance to avoid type issues from dynamic import shape
  private pusher: any | null = null;
  private driverChannel: any = null;
  private driverId: string | null = null;
  private listeners: Map<string, Set<Function>> = new Map(); // ✅ FIX: Support multiple listeners per event
  private authToken: string | null = null;
  private processedEvents: Set<string> = new Set(); // ✅ FIX: Event deduplication
  private eventTTL = 5000; // 5 seconds

  /**
   * Initialize Pusher connection
   */
  async initialize(driverId: string) {
    console.log(' Starting Pusher initialization for driver:', driverId);
    
    if (this.pusher && this.driverId === driverId) {
      console.log(' Pusher already initialized for driver:', driverId);
      return;
    }

    try {
      this.driverId = driverId;
      console.log(' About to get auth token...');

      // Get and store the auth token
      this.authToken = await getToken();
      console.log(' Stored auth token for Pusher:', !!this.authToken);

      console.log(' Initializing Pusher connection...', {
        key: PUSHER_KEY,
        cluster: PUSHER_CLUSTER,
        driverId
      });

      // Initialize Pusher
      this.pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        forceTLS: true,
        disableStats: true,
        // Improve connection stability
        activityTimeout: 30000, // 30 seconds
        pongTimeout: 10000, // 10 seconds
        authorizer: (channel: any, options: any) => ({
          authorize: async (socketId: string, callback: Function) => {
            try {
              console.log(' Starting Pusher auth for channel:', channel.name);

              // Increase timeout for auth requests
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds

              const response = await fetch(`${API_CONFIG.BASE_URL}/api/pusher/auth`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}),
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

              if (!response.ok) {
                throw new Error(`Auth failed: ${response.status}`);
              }

              const data = await response.json();
              console.log(' Pusher auth successful');
              callback(false, data);
            } catch (error) {
              console.error(' Pusher auth error:', error);
              callback(true, error);
            }
          },
        }),
      });

      // Connection event handlers
      this.pusher.connection.bind('connected', () => {
        console.log('✅ Pusher connected successfully');
      });

      this.pusher.connection.bind('error', (err: any) => {
        console.error('❌ Pusher connection error:', err);
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('🔌 Pusher disconnected');
      });

      this.pusher.connection.bind('reconnecting', () => {
        console.log('🔄 Pusher reconnecting...');
      });

      this.pusher.connection.bind('state_change', (states: any) => {
        console.log('📡 Pusher state changed:', states.previous, '->', states.current);
      });

      // Subscribe to driver-specific channel
      const channelName = `driver-${this.driverId}`;
      this.driverChannel = this.pusher.subscribe(channelName);

      console.log(' Subscribed to channel:', channelName);

      // Bind to all important events
      this.bindDriverEvents();

      console.log(' Pusher service initialized successfully');
    } catch (error) {
      console.error(' Failed to initialize Pusher:', error);
      // Don't throw, just log
    }
  }

  /**
   * Bind all driver-specific events
   */
  private bindDriverEvents() {
    if (!this.driverChannel) return;

    // Prevent duplicate bindings
    this.driverChannel.unbind_all();

    // ============ JOB EVENTS ============
    
    // 1. JOB ASSIGNED - Backward compatibility (single order)
    this.driverChannel.bind('job-assigned', (data: any) => {
      console.log('📦 JOB ASSIGNED EVENT:', data);
      audioService.playRouteMatchSound();
      
      // Job assigned is always a single order
      this.notifyListeners('job-assigned', {
        ...data,
        matchType: 'order',
        jobCount: 1
      });
      
      // Show critical notification for job assignment
      notificationService.showRouteMatchNotification(
        'New Order Assigned',
        data.message || 'A job has been assigned to you',
        'order',
        { jobCount: 1, ...data }
      );
    });

    // 2. JOB REMOVED - INSTANT REMOVAL from UI
    this.driverChannel.bind('job-removed', (data: any) => {
      console.log('🗑️ JOB REMOVED EVENT:', data);
      this.notifyListeners('job-removed', data);
      this.showNotification('Job Removed', data.message || 'A job has been removed from your schedule');
    });

    // 3. JOB OFFER - New job after auto-reassignment (single order)
    this.driverChannel.bind('job-offer', (data: any) => {
      console.log('🎁 JOB OFFER EVENT:', data);
      audioService.playRouteMatchSound();
      
      // Job offer is always a single order
      this.notifyListeners('job-offer', {
        ...data,
        matchType: 'order',
        jobCount: 1
      });
      
      // Show critical notification for job offer
      notificationService.showRouteMatchNotification(
        'New Order Offer',
        data.message || 'You have a new job offer',
        'order',
        { jobCount: 1, ...data }
      );
    });

    // ============ ROUTE EVENTS ============
    
    // 4. ROUTE MATCHED - Primary event for new routes
    this.driverChannel.bind('route-matched', (data: any) => {
      console.log('🎯 ROUTE MATCHED EVENT:', data);
      audioService.playRouteMatchSound();
      
      // Determine match type based on data
      const matchType = data.type === 'single-order' ? 'order' : 'route';
      const jobCount = data.jobCount || data.dropCount || data.bookingsCount || 1;
      const bookingRef = data.bookingReference || data.orderNumber || 'N/A';
      
      // Notify listeners with enhanced data including matchType
      this.notifyListeners('route-matched', {
        ...data,
        matchType,
        jobCount,
        bookingReference: bookingRef,
        orderNumber: bookingRef,
      });
      
      // Show critical notification (works even in background)
      notificationService.showRouteMatchNotification(
        `New ${matchType === 'order' ? 'Order' : 'Route'} Matched!`,
        matchType === 'order'
          ? `Order #${bookingRef}`
          : `Route #${bookingRef} - ${jobCount} stops`,
        matchType,
        { 
          jobCount, 
          bookingReference: bookingRef,
          orderNumber: bookingRef,
          ...data 
        }
      );
    });

    // 5. ROUTE REMOVED - With earnings data for partial completion
    this.driverChannel.bind('route-removed', (data: any) => {
      console.log('🚫 ROUTE REMOVED EVENT:', data);
      
      // Show earnings info if available
      if (data.earningsData) {
        const earned = data.earningsData.adjustedAmountPence / 100;
        const message = `You earned £${earned.toFixed(2)} for ${data.completedDrops} completed drops`;
        this.showNotification('Route Cancelled', message);
      } else {
        this.showNotification('Route Removed', data.message || 'Route has been removed');
      }
      
      this.notifyListeners('route-removed', data);
    });

    // 6. ROUTE OFFER - New route after auto-reassignment
    this.driverChannel.bind('route-offer', (data: any) => {
      console.log('🛣️ ROUTE OFFER EVENT:', data);
      audioService.playRouteMatchSound();
      
      // Route offer is always a multi-drop route
      const jobCount = data.dropCount || data.jobCount || 1;
      this.notifyListeners('route-offer', {
        ...data,
        matchType: 'route',
        jobCount
      });
      
      // Show critical notification for route offer
      notificationService.showRouteMatchNotification(
        'New Route Offer',
        `${jobCount} stops - £${(data.estimatedEarnings || 0).toFixed(2)}`,
        'route',
        { jobCount, ...data }
      );
    });

    // ============ PERFORMANCE EVENTS ============
    
    // 7. ACCEPTANCE RATE UPDATED - Decrease by 5% on decline
    this.driverChannel.bind('acceptance-rate-updated', (data: any) => {
      console.log('📉 ACCEPTANCE RATE UPDATED:', data);
      this.notifyListeners('acceptance-rate-updated', data);
      this.showNotification(
        'Performance Update',
        `Acceptance rate: ${data.acceptanceRate}% (${data.change}%)`
      );
    });

    // 8. DRIVER PERFORMANCE UPDATED - General performance metrics
    this.driverChannel.bind('driver-performance-updated', (data: any) => {
      console.log('📊 PERFORMANCE UPDATED:', data);
      this.notifyListeners('driver-performance-updated', data);
    });

    // ============ SCHEDULE EVENTS ============
    
    // 9. SCHEDULE UPDATED - Schedule changes
    this.driverChannel.bind('schedule-updated', (data: any) => {
      console.log('📅 SCHEDULE UPDATED:', data);
      this.notifyListeners('schedule-updated', data);
    });

    // ============ EARNINGS EVENTS ============
    
    // 10. EARNINGS UPDATED - Earnings recalculated
    this.driverChannel.bind('earnings-updated', (data: any) => {
      console.log('💰 EARNINGS UPDATED:', data);
      this.notifyListeners('earnings-updated', data);
      if (data.amountPence) {
        const amount = data.amountPence / 100;
        this.showNotification('Earnings Updated', `£${amount.toFixed(2)} added to your account`);
      }
    });

    // ============ REASSIGNMENT EVENTS ============
    
    // 11. ORDER REASSIGNED - Order moved to another driver
    this.driverChannel.bind('order-reassigned', (data: any) => {
      console.log('🔄 ORDER REASSIGNED:', data);
      this.notifyListeners('order-reassigned', data);
    });

    // 12. ROUTE REASSIGNED - Route moved to another driver  
    this.driverChannel.bind('route-reassigned', (data: any) => {
      console.log('🔄 ROUTE REASSIGNED:', data);
      this.notifyListeners('route-reassigned', data);
    });

    // ============ GENERAL EVENTS ============
    
    // 13. NOTIFICATION - General notifications
    this.driverChannel.bind('notification', (data: any) => {
      console.log('🔔 NOTIFICATION EVENT:', data);
      this.notifyListeners('notification', data);
      if (data.title && data.message) {
        this.showNotification(data.title, data.message);
      }
    });

    // 14. ADMIN MESSAGE - Admin communications
    this.driverChannel.bind('admin_message', (data: any) => {
      console.log('💬 ADMIN MESSAGE:', data);
      this.notifyListeners('admin_message', data);
      this.showNotification('Support Message', data.content || data.message || 'You have a new message from support');
    });

    // ============ CHAT SYSTEM EVENTS ============

    // 15. CHAT CLOSED - Conversation closed by admin or driver
    this.driverChannel.bind('chat_closed', (data: any) => {
      console.log('🔴 CHAT CLOSED:', data);
      this.notifyListeners('chat_closed', data);
      this.showNotification(
        'Conversation Closed',
        `${data.closedByName || 'Support'} has closed the conversation`
      );
    });

    // 16. CHAT REOPENED - Conversation reopened by admin
    this.driverChannel.bind('chat_reopened', (data: any) => {
      console.log('🟢 CHAT REOPENED:', data);
      this.notifyListeners('chat_reopened', data);
      this.showNotification(
        'Conversation Reopened',
        'Support has reopened the conversation. You can continue chatting.'
      );
    });

    // 17. TYPING INDICATOR - Real-time typing status
    this.driverChannel.bind('typing_indicator', (data: any) => {
      console.log('⌨️ TYPING INDICATOR:', data);
      this.notifyListeners('typing_indicator', data);
      // No notification - just update UI
    });

    // 18. MESSAGE READ - Read receipt
    this.driverChannel.bind('message_read', (data: any) => {
      console.log('✓✓ MESSAGE READ:', data);
      this.notifyListeners('message_read', data);
      // No notification - just update UI with blue ticks
    });

    console.log('✅ All 18 driver events bound successfully');
  }

  /**
   * Add event listener (supports multiple listeners per event)
   */
  addEventListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    console.log(` Added listener for event: ${event} (total: ${this.listeners.get(event)!.size})`);
  }

  /**
   * Remove event listener (can remove specific callback or all for event)
   */
  removeEventListener(event: string, callback?: Function) {
    if (!callback) {
      // Remove all listeners for this event
      const count = this.listeners.get(event)?.size || 0;
      this.listeners.delete(event);
      console.log(`  Removed all ${count} listener(s) for event: ${event}`);
    } else {
      // Remove specific listener
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        console.log(`  Removed specific listener for event: ${event} (remaining: ${eventListeners.size})`);
        
        // Clean up empty sets
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    }
  }

  /**
   * Notify all listeners for an event (with deduplication)
   */
  private notifyListeners(event: string, data: any) {
    // ✅ FIX: Event deduplication to prevent double-handling
    const eventId = `${event}_${data.routeId || data.bookingId || data.orderId || ''}_${Math.floor(Date.now() / 1000)}`;
    
    if (this.processedEvents.has(eventId)) {
      console.log(`⚠️ Duplicate event detected: ${eventId} - ignoring`);
      return;
    }
    
    // Mark as processed
    this.processedEvents.add(eventId);
    
    // Auto-remove after TTL to prevent memory leak
    setTimeout(() => {
      this.processedEvents.delete(eventId);
    }, this.eventTTL);
    
    // Notify all listeners
    const callbacks = this.listeners.get(event);
    if (callbacks && callbacks.size > 0) {
      console.log(` Notifying ${callbacks.size} listener(s) for event: ${event}`);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in listener for event ${event}:`, error);
        }
      });
    } else {
      console.log(`  No listeners registered for event: ${event}`);
    }
  }

  /**
   * Show local notification (React Native)
   */
  private async showNotification(title: string, message: string, data?: any) {
    console.log(`🔔 Showing notification: ${title} - ${message}`);
    
    try {
      await notificationService.showLocalNotification(title, message, data);
    } catch (error) {
      console.error('❌ Failed to show notification:', error);
      // Fallback to console log only
      console.log(` Notification: ${title} - ${message}`);
    }
  }

  /**
   * Disconnect Pusher - Called on logout or app close
   */
  disconnect() {
    if (this.driverChannel) {
      console.log('📡 Unsubscribing from driver channel...');
      this.driverChannel.unbind_all();
      this.pusher?.unsubscribe(`driver-${this.driverId}`);
      this.driverChannel = null;
    }
    
    if (this.pusher) {
      console.log('🔌 Disconnecting Pusher...');
      this.pusher.disconnect();
      this.pusher = null;
    }
    
    this.driverId = null;
    this.authToken = null;
    this.listeners.clear();
    this.processedEvents.clear(); // ✅ FIX: Clear processed events cache
    
    console.log('✅ Pusher disconnected and cleaned up');
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.pusher?.connection?.state === 'connected';
  }

  /**
   * Get current driver ID
   */
  getDriverId(): string | null {
    return this.driverId;
  }
}

export default new PusherService();
