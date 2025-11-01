// Render Analytics integration for Speedy Van
export class RenderAnalyticsService {
  private static instance: RenderAnalyticsService;
  private isEnabled: boolean = false;
  private apiKey: string | null = null;
  private baseUrl: string = 'https://api.render.com/v1';

  private constructor() {
    this.apiKey = process.env.RENDER_ANALYTICS_API_KEY || null;
    this.isEnabled = !!this.apiKey && process.env.NODE_ENV === 'production';
  }

  public static getInstance(): RenderAnalyticsService {
    if (!RenderAnalyticsService.instance) {
      RenderAnalyticsService.instance = new RenderAnalyticsService();
    }
    return RenderAnalyticsService.instance;
  }

  // Track custom events
  public track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      return;
    }

    try {
      // Send to Render Analytics API
      this.sendToRenderAPI('events', {
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          service: 'speedy-van-web',
          environment: process.env.NODE_ENV,
        },
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Track booking events
  public trackBookingStarted(properties: {
    serviceType: string;
    pickupPostcode: string;
    dropoffPostcode: string;
    userId?: string;
  }) {
    this.track('booking_started', {
      ...properties,
      category: 'booking',
    });
  }

  public trackBookingCompleted(properties: {
    bookingId: string;
    totalPrice: number;
    serviceType: string;
    userId?: string;
  }) {
    this.track('booking_completed', {
      ...properties,
      category: 'booking',
    });
  }

  public trackBookingCancelled(properties: {
    bookingId: string;
    reason: string;
    userId?: string;
  }) {
    this.track('booking_cancelled', {
      ...properties,
      category: 'booking',
    });
  }

  // Track driver events
  public trackDriverLogin(properties: {
    driverId: string;
    loginMethod: string;
  }) {
    this.track('driver_login', {
      ...properties,
      category: 'driver',
    });
  }

  public trackDriverAcceptRoute(properties: {
    driverId: string;
    routeId: string;
    estimatedDuration: number;
  }) {
    this.track('driver_accept_route', {
      ...properties,
      category: 'driver',
    });
  }

  public trackDriverCompleteRoute(properties: {
    driverId: string;
    routeId: string;
    actualDuration: number;
    dropsCompleted: number;
  }) {
    this.track('driver_complete_route', {
      ...properties,
      category: 'driver',
    });
  }

  // Track customer events
  public trackCustomerLogin(properties: {
    customerId: string;
    loginMethod: string;
  }) {
    this.track('customer_login', {
      ...properties,
      category: 'customer',
    });
  }

  public trackCustomerViewPricing(properties: {
    pickupPostcode: string;
    dropoffPostcode: string;
    serviceType: string;
    estimatedPrice: number;
    customerId?: string;
  }) {
    this.track('customer_view_pricing', {
      ...properties,
      category: 'customer',
    });
  }

  public trackCustomerMakePayment(properties: {
    customerId: string;
    bookingId: string;
    amount: number;
    paymentMethod: string;
  }) {
    this.track('customer_make_payment', {
      ...properties,
      category: 'customer',
    });
  }

  // Track admin events
  public trackAdminLogin(properties: {
    adminId: string;
    adminRole: string;
  }) {
    this.track('admin_login', {
      ...properties,
      category: 'admin',
    });
  }

  public trackAdminViewDashboard(properties: {
    adminId: string;
    dashboardType: string;
  }) {
    this.track('admin_view_dashboard', {
      ...properties,
      category: 'admin',
    });
  }

  // Track performance events
  public trackApiSlowResponse(properties: {
    route: string;
    method: string;
    responseTime: number;
    threshold: number;
  }) {
    this.track('api_slow_response', {
      ...properties,
      category: 'performance',
      severity: 'warning',
    });
  }

  public trackDbSlowQuery(properties: {
    operation: string;
    table: string;
    queryTime: number;
    threshold: number;
  }) {
    this.track('db_slow_query', {
      ...properties,
      category: 'performance',
      severity: 'warning',
    });
  }

  public trackHighMemoryUsage(properties: {
    memoryUsage: number;
    threshold: number;
  }) {
    this.track('high_memory_usage', {
      ...properties,
      category: 'performance',
      severity: 'critical',
    });
  }

  public trackHighCpuUsage(properties: {
    cpuUsage: number;
    threshold: number;
  }) {
    this.track('high_cpu_usage', {
      ...properties,
      category: 'performance',
      severity: 'critical',
    });
  }

  // Track page views
  public trackPageView(properties: {
    page: string;
    title: string;
    userId?: string;
    userRole?: string;
  }) {
    this.track('page_view', {
      ...properties,
      category: 'navigation',
    });
  }

  // Track user actions
  public trackUserAction(properties: {
    action: string;
    category: string;
    label?: string;
    value?: number;
    userId?: string;
  }) {
    this.track('user_action', {
      ...properties,
    });
  }

  // Track errors
  public trackError(properties: {
    error: string;
    stack?: string;
    context?: Record<string, any>;
    userId?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) {
    this.track('error_occurred', {
      ...properties,
      category: 'error',
    });
  }

  // Track business metrics
  public trackBusinessMetric(properties: {
    metric: string;
    value: number;
    unit: string;
    context?: Record<string, any>;
  }) {
    this.track('business_metric', {
      ...properties,
      category: 'business',
    });
  }

  // Send data to Render API
  private async sendToRenderAPI(endpoint: string, data: any) {
    if (!this.apiKey) {
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Render API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send data to Render API:', error);
    }
  }

  // Batch send events
  public async batchTrack(events: Array<{ event: string; properties?: Record<string, any> }>) {
    if (!this.isEnabled || events.length === 0) {
      return;
    }

    try {
      await this.sendToRenderAPI('events/batch', {
        events: events.map(({ event, properties }) => ({
          event,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            service: 'speedy-van-web',
            environment: process.env.NODE_ENV,
          },
        })),
      });
    } catch (error) {
      console.error('Failed to batch track events:', error);
    }
  }

  // Get analytics configuration
  public getConfig() {
    return {
      enabled: this.isEnabled,
      apiKey: this.apiKey ? '***' : null,
      baseUrl: this.baseUrl,
    };
  }
}

// Export singleton instance
export const renderAnalyticsService = RenderAnalyticsService.getInstance();


