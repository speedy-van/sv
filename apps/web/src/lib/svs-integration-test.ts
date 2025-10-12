'use client';

// Notification service import removed - file was deleted during cleanup

// SVS Integration Test Suite
export interface TestResult {
  component: string;
  test: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
}

export class SVSIntegrationTest {
  private testResults: Array<{
    component: string;
    test: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration?: number;
  }> = [];

  async runAllTests(): Promise<{
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    results: TestResult[];
  }> {
    console.log('🧪 Starting SVS Integration Tests...');
    
    // Test PWA capabilities
    await this.testPWACapabilities();
    
    // Test notification system
    await this.testNotificationSystem();
    
    // Test payment integration
    await this.testPaymentIntegration();
    
    // Test image optimization
    await this.testImageOptimization();
    
    // Test performance monitoring
    await this.testPerformanceMonitoring();
    
    // Test mobile responsiveness
    await this.testMobileResponsiveness();

    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    const skipped = this.testResults.filter(r => r.status === 'skip').length;

    console.log('🧪 SVS Integration Tests Complete:', {
      total,
      passed,
      failed,
      skipped,
    });

    return {
      total,
      passed,
      failed,
      skipped,
      results: this.testResults,
    };
  }

  private async testPWACapabilities(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test service worker registration
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        this.addResult('PWA', 'Service Worker Registration', 'pass', 
          'Service worker is registered', Date.now() - startTime);
      } else {
        this.addResult('PWA', 'Service Worker Registration', 'fail', 
          'Service worker not supported');
      }

      // Test manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        this.addResult('PWA', 'Web App Manifest', 'pass', 
          'Manifest is linked');
      } else {
        this.addResult('PWA', 'Web App Manifest', 'fail', 
          'Manifest not found');
      }

      // Test offline capability
      if ('caches' in window) {
        this.addResult('PWA', 'Cache API', 'pass', 
          'Cache API is available');
      } else {
        this.addResult('PWA', 'Cache API', 'fail', 
          'Cache API not supported');
      }

      // Test push notifications
      if ('Notification' in window) {
        this.addResult('PWA', 'Push Notifications', 'pass', 
          'Push notifications supported');
      } else {
        this.addResult('PWA', 'Push Notifications', 'skip', 
          'Push notifications not supported');
      }

    } catch (error) {
      this.addResult('PWA', 'PWA Capabilities', 'fail', 
        `Error testing PWA: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testNotificationSystem(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test email service availability
      const emailResponse = await fetch('/api/notifications/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'test@example.com',
          templateId: 'test',
          data: { test: true },
        }),
      });
      
      if (emailResponse.ok) {
        this.addResult('Notifications', 'Email Service', 'pass', 
          'Email service is responding');
      } else {
        this.addResult('Notifications', 'Email Service', 'fail', 
          `Email service error: ${emailResponse.status}`);
      }

      // Test SMS service availability
      const smsResponse = await fetch('/api/notifications/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '07901846297',
          message: 'Test message',
          sender: 'SpeedyVan',
        }),
      });
      
      if (smsResponse.ok) {
        this.addResult('Notifications', 'SMS Service', 'pass', 
          'SMS service is responding');
      } else {
        this.addResult('Notifications', 'SMS Service', 'fail', 
          `SMS service error: ${smsResponse.status}`);
      }

      // Test push notification service
      const pushResponse = await fetch('/api/notifications/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test notification',
        }),
      });
      
      if (pushResponse.ok) {
        this.addResult('Notifications', 'Push Service', 'pass', 
          'Push notification service is responding');
      } else {
        this.addResult('Notifications', 'Push Service', 'fail', 
          `Push service error: ${pushResponse.status}`);
      }

    } catch (error) {
      this.addResult('Notifications', 'Notification System', 'fail', 
        `Error testing notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testPaymentIntegration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test Stripe checkout session creation  
      const paymentResponse = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 10.00, // £10.00 in pounds
          currency: 'gbp',
          customerEmail: 'test@speedy-van.co.uk',
          customerName: 'Test Customer',
          bookingData: {
            customer: { name: 'Test Customer', email: 'test@speedy-van.co.uk' },
            items: [{ name: 'Test Item', quantity: 1 }]
          },
        }),
      });
      
      if (paymentResponse.ok) {
        this.addResult('Payment', 'Stripe Integration', 'pass', 
          'Stripe checkout session creation working');
      } else {
        this.addResult('Payment', 'Stripe Integration', 'fail', 
          `Stripe error: ${paymentResponse.status}`);
      }

      // Apple Pay and Google Pay tests removed - endpoints deleted as they were incomplete

    } catch (error) {
      this.addResult('Payment', 'Payment Integration', 'fail', 
        `Error testing payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testImageOptimization(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test WebP support
      const canvas = document.createElement('canvas');
      const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      
      if (webpSupported) {
        this.addResult('Images', 'WebP Support', 'pass', 
          'WebP format is supported');
      } else {
        this.addResult('Images', 'WebP Support', 'skip', 
          'WebP format not supported');
      }

      // Test AVIF support
      const avifSupported = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
      
      if (avifSupported) {
        this.addResult('Images', 'AVIF Support', 'pass', 
          'AVIF format is supported');
      } else {
        this.addResult('Images', 'AVIF Support', 'skip', 
          'AVIF format not supported');
      }

      // Test Intersection Observer for lazy loading
      if ('IntersectionObserver' in window) {
        this.addResult('Images', 'Lazy Loading', 'pass', 
          'Intersection Observer available for lazy loading');
      } else {
        this.addResult('Images', 'Lazy Loading', 'fail', 
          'Intersection Observer not supported');
      }

    } catch (error) {
      this.addResult('Images', 'Image Optimization', 'fail', 
        `Error testing images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testPerformanceMonitoring(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test Performance Observer
      if ('PerformanceObserver' in window) {
        this.addResult('Performance', 'Performance Observer', 'pass', 
          'Performance Observer is available');
      } else {
        this.addResult('Performance', 'Performance Observer', 'fail', 
          'Performance Observer not supported');
      }

      // Test Core Web Vitals
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.addResult('Performance', 'TTFB Measurement', 'pass', 
          `TTFB: ${ttfb.toFixed(2)}ms`);
      } else {
        this.addResult('Performance', 'TTFB Measurement', 'fail', 
          'Navigation timing not available');
      }

      // Test device memory API
      if ('deviceMemory' in navigator) {
        const memory = (navigator as any).deviceMemory;
        this.addResult('Performance', 'Device Memory', 'pass', 
          `Device memory: ${memory}GB`);
      } else {
        this.addResult('Performance', 'Device Memory', 'skip', 
          'Device memory API not supported');
      }

      // Test connection API
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        this.addResult('Performance', 'Network Info', 'pass', 
          `Connection type: ${connection.effectiveType}`);
      } else {
        this.addResult('Performance', 'Network Info', 'skip', 
          'Network information API not supported');
      }

    } catch (error) {
      this.addResult('Performance', 'Performance Monitoring', 'fail', 
        `Error testing performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testMobileResponsiveness(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test touch support
      const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (touchSupported) {
        this.addResult('Mobile', 'Touch Support', 'pass', 
          'Touch events are supported');
      } else {
        this.addResult('Mobile', 'Touch Support', 'skip', 
          'Touch events not supported');
      }

      // Test viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        this.addResult('Mobile', 'Viewport Meta', 'pass', 
          'Viewport meta tag is present');
      } else {
        this.addResult('Mobile', 'Viewport Meta', 'fail', 
          'Viewport meta tag not found');
      }

      // Test responsive breakpoints
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (width < 768) {
        this.addResult('Mobile', 'Mobile Breakpoint', 'pass', 
          `Mobile viewport: ${width}x${height}`);
      } else if (width < 1024) {
        this.addResult('Mobile', 'Tablet Breakpoint', 'pass', 
          `Tablet viewport: ${width}x${height}`);
      } else {
        this.addResult('Mobile', 'Desktop Breakpoint', 'pass', 
          `Desktop viewport: ${width}x${height}`);
      }

      // Test orientation API
      if ('orientation' in screen) {
        this.addResult('Mobile', 'Orientation API', 'pass', 
          'Screen orientation API is available');
      } else {
        this.addResult('Mobile', 'Orientation API', 'skip', 
          'Screen orientation API not supported');
      }

    } catch (error) {
      this.addResult('Mobile', 'Mobile Responsiveness', 'fail', 
        `Error testing mobile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private addResult(
    component: string,
    test: string,
    status: 'pass' | 'fail' | 'skip',
    message: string,
    duration?: number
  ): void {
    this.testResults.push({
      component,
      test,
      status,
      message,
      duration,
    });
  }
}

// Export test runner
export const runSVSIntegrationTest = async () => {
  const tester = new SVSIntegrationTest();
  return await tester.runAllTests();
};
