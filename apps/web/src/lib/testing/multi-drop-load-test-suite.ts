/**
 * Multi-Drop Route Load Testing Scenarios
 * 
 * Predefined test scenarios for comprehensive load testing
 * of multi-drop route system under various conditions
 */

import { MultiDropLoadTester, LoadTestConfig, LoadTestScenario } from './multi-drop-load-tester';

export class MultiDropLoadTestSuite {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * High-volume booking creation scenario
   */
  getHighVolumeBookingScenario(): LoadTestScenario {
    return {
      name: 'High Volume Multi-Drop Booking Creation',
      weight: 30, // 30% of total load
      endpoints: [
        {
          path: '/api/bookings/multi-drop',
          method: 'POST',
          payload: this.generateMultiDropBookingPayload(),
          expectedStatusCodes: [200, 201],
          timeoutMs: 10000,
          retries: 2
        },
        {
          path: '/api/bookings/estimate',
          method: 'POST',
          payload: this.generateEstimatePayload(),
          expectedStatusCodes: [200],
          timeoutMs: 5000,
          retries: 1
        }
      ],
      userBehavior: {
        thinkTime: { min: 2000, max: 8000 }, // 2-8 seconds between requests
        sessionDuration: { min: 120, max: 300 }, // 2-5 minutes per session
        requestsPerSession: { min: 3, max: 12 }
      }
    };
  }

  /**
   * Driver availability and route optimization scenario
   */
  getDriverAvailabilityScenario(): LoadTestScenario {
    return {
      name: 'Driver Availability & Route Optimization',
      weight: 25, // 25% of total load
      endpoints: [
        {
          path: '/api/drivers/available',
          method: 'GET',
          expectedStatusCodes: [200],
          timeoutMs: 3000,
          retries: 2
        },
        {
          path: '/api/routes/optimize',
          method: 'POST',
          payload: this.generateRouteOptimizationPayload(),
          expectedStatusCodes: [200],
          timeoutMs: 15000,
          retries: 1
        },
        {
          path: '/api/drivers/capacity',
          method: 'GET',
          expectedStatusCodes: [200],
          timeoutMs: 2000,
          retries: 2
        }
      ],
      userBehavior: {
        thinkTime: { min: 1000, max: 5000 },
        sessionDuration: { min: 60, max: 180 },
        requestsPerSession: { min: 5, max: 20 }
      }
    };
  }

  /**
   * Real-time tracking and updates scenario
   */
  getRealTimeTrackingScenario(): LoadTestScenario {
    return {
      name: 'Real-Time Tracking & Updates',
      weight: 20, // 20% of total load
      endpoints: [
        {
          path: '/api/tracking/live',
          method: 'GET',
          expectedStatusCodes: [200],
          timeoutMs: 2000,
          retries: 3
        },
        {
          path: '/api/routes/status',
          method: 'GET',
          expectedStatusCodes: [200],
          timeoutMs: 1500,
          retries: 2
        },
        {
          path: '/api/drops/update-status',
          method: 'PATCH',
          payload: this.generateDropUpdatePayload(),
          expectedStatusCodes: [200],
          timeoutMs: 3000,
          retries: 1
        }
      ],
      userBehavior: {
        thinkTime: { min: 500, max: 3000 }, // More frequent updates
        sessionDuration: { min: 300, max: 600 }, // Longer sessions for tracking
        requestsPerSession: { min: 10, max: 50 }
      }
    };
  }

  /**
   * Performance analytics and reporting scenario
   */
  getAnalyticsScenario(): LoadTestScenario {
    return {
      name: 'Performance Analytics & Reporting',
      weight: 15, // 15% of total load
      endpoints: [
        {
          path: '/api/analytics/performance',
          method: 'GET',
          expectedStatusCodes: [200],
          timeoutMs: 5000,
          retries: 1
        },
        {
          path: '/api/analytics/routes',
          method: 'GET',
          expectedStatusCodes: [200],
          timeoutMs: 8000,
          retries: 1
        },
        {
          path: '/api/performance/routes?endpoint=analytics&timeframe=hour',
          method: 'GET',
          expectedStatusCodes: [200],
          timeoutMs: 6000,
          retries: 2
        }
      ],
      userBehavior: {
        thinkTime: { min: 5000, max: 15000 }, // Longer think time for analysis
        sessionDuration: { min: 180, max: 480 },
        requestsPerSession: { min: 2, max: 8 }
      }
    };
  }

  /**
   * Admin dashboard monitoring scenario
   */
  getAdminMonitoringScenario(): LoadTestScenario {
    return {
      name: 'Admin Dashboard Monitoring',
      weight: 10, // 10% of total load
      endpoints: [
        {
          path: '/api/admin/dashboard/overview',
          method: 'GET',
          expectedStatusCodes: [200],
          timeoutMs: 4000,
          retries: 1
        },
        {
          path: '/api/admin/routes/active',
          method: 'GET',
          expectedStatusCodes: [200],
          timeoutMs: 3000,
          retries: 2
        },
        {
          path: '/api/admin/system/health',
          method: 'GET',
          expectedStatusCodes: [200],
          timeoutMs: 2000,
          retries: 3
        }
      ],
      userBehavior: {
        thinkTime: { min: 3000, max: 10000 },
        sessionDuration: { min: 600, max: 1800 }, // Long admin sessions
        requestsPerSession: { min: 5, max: 25 }
      }
    };
  }

  /**
   * Generate test payloads
   */
  private generateMultiDropBookingPayload() {
    return {
      customerInfo: {
        name: `Test Customer ${Math.floor(Math.random() * 10000)}`,
        phone: `+44${Math.floor(Math.random() * 1000000000)}`,
        email: `test${Math.floor(Math.random() * 10000)}@example.com`
      },
      stops: this.generateRandomStops(Math.floor(Math.random() * 5) + 2),
      serviceLevel: ['standard', 'express', 'same_day'][Math.floor(Math.random() * 3)],
      scheduledAt: new Date(Date.now() + Math.random() * 86400000).toISOString(),
      specialRequirements: Math.random() > 0.7 ? ['fragile', 'heavy'] : [],
      timeWindow: {
        start: new Date(Date.now() + 3600000).toISOString(),
        end: new Date(Date.now() + 7200000).toISOString()
      }
    };
  }

  private generateEstimatePayload() {
    return {
      pickupLocation: {
        latitude: 51.5074 + (Math.random() - 0.5) * 0.1,
        longitude: -0.1278 + (Math.random() - 0.5) * 0.1,
        address: `Test Pickup Address ${Math.floor(Math.random() * 1000)}`
      },
      destinations: this.generateRandomStops(Math.floor(Math.random() * 4) + 1),
      serviceType: ['standard', 'express'][Math.floor(Math.random() * 2)]
    };
  }

  private generateRouteOptimizationPayload() {
    return {
      driverId: `driver_${Math.floor(Math.random() * 100)}`,
      stops: this.generateRandomStops(Math.floor(Math.random() * 8) + 3),
      constraints: {
        maxDistance: Math.floor(Math.random() * 100) + 50,
        timeWindow: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 28800000).toISOString() // 8 hours
        },
        vehicleCapacity: {
          weight: Math.floor(Math.random() * 1000) + 500,
          volume: Math.floor(Math.random() * 50) + 20
        }
      }
    };
  }

  private generateDropUpdatePayload() {
    const statuses = ['picked_up', 'in_transit', 'delivered', 'attempted'];
    return {
      dropId: `drop_${Math.floor(Math.random() * 10000)}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      location: {
        latitude: 51.5074 + (Math.random() - 0.5) * 0.2,
        longitude: -0.1278 + (Math.random() - 0.5) * 0.2
      },
      timestamp: new Date().toISOString(),
      notes: Math.random() > 0.8 ? `Update note ${Math.floor(Math.random() * 1000)}` : undefined
    };
  }

  private generateRandomStops(count: number) {
    const stops = [];
    for (let i = 0; i < count; i++) {
      stops.push({
        address: `Test Address ${i + 1}, London`,
        latitude: 51.5074 + (Math.random() - 0.5) * 0.2,
        longitude: -0.1278 + (Math.random() - 0.5) * 0.2,
        timeWindow: Math.random() > 0.5 ? {
          start: new Date(Date.now() + Math.random() * 86400000).toISOString(),
          end: new Date(Date.now() + Math.random() * 86400000 + 3600000).toISOString()
        } : undefined,
        priority: Math.floor(Math.random() * 5) + 1
      });
    }
    return stops;
  }

  /**
   * Create comprehensive load test configuration
   */
  createLoadTestConfig(options: {
    maxUsers?: number;
    duration?: number;
    rampUp?: number;
  } = {}): LoadTestConfig {
    const {
      maxUsers = 500,
      duration = 300, // 5 minutes
      rampUp = 60     // 1 minute ramp up
    } = options;

    return {
      baseUrl: this.baseUrl,
      maxConcurrentUsers: maxUsers,
      testDuration: duration,
      rampUpTime: rampUp,
      scenarios: [
        this.getHighVolumeBookingScenario(),
        this.getDriverAvailabilityScenario(),
        this.getRealTimeTrackingScenario(),
        this.getAnalyticsScenario(),
        this.getAdminMonitoringScenario()
      ]
    };
  }

  /**
   * Create stress test configuration for extreme load
   */
  createStressTestConfig(): LoadTestConfig {
    return {
      baseUrl: this.baseUrl,
      maxConcurrentUsers: 1000,
      testDuration: 600, // 10 minutes
      rampUpTime: 120,   // 2 minute ramp up
      scenarios: [
        {
          ...this.getHighVolumeBookingScenario(),
          weight: 40, // More booking load for stress test
          userBehavior: {
            thinkTime: { min: 500, max: 2000 }, // Faster requests
            sessionDuration: { min: 60, max: 180 },
            requestsPerSession: { min: 5, max: 20 }
          }
        },
        {
          ...this.getDriverAvailabilityScenario(),
          weight: 30,
          userBehavior: {
            thinkTime: { min: 200, max: 1000 },
            sessionDuration: { min: 30, max: 120 },
            requestsPerSession: { min: 10, max: 30 }
          }
        },
        {
          ...this.getRealTimeTrackingScenario(),
          weight: 30,
          userBehavior: {
            thinkTime: { min: 100, max: 500 }, // Very frequent updates
            sessionDuration: { min: 120, max: 300 },
            requestsPerSession: { min: 20, max: 100 }
          }
        }
      ]
    };
  }

  /**
   * Run standard load test suite
   */
  async runStandardLoadTest(): Promise<void> {
    console.log('🧪 Starting Standard Multi-Drop Load Test');
    console.log('=========================================');

    const config = this.createLoadTestConfig();
    const tester = new MultiDropLoadTester(config);

    try {
      const results = await tester.runLoadTests();
      
      console.log('\n📊 Standard Load Test Results:');
      this.printResults(results);

      const report = tester.generateReport();
      this.saveReport(report, 'standard-load-test');

    } catch (error) {
      console.error('❌ Standard load test failed:', error);
      throw error;
    }
  }

  /**
   * Run stress test suite
   */
  async runStressTest(): Promise<void> {
    console.log('💥 Starting Multi-Drop Stress Test');
    console.log('==================================');

    const config = this.createStressTestConfig();
    const tester = new MultiDropLoadTester(config);

    try {
      const results = await tester.runLoadTests();
      
      console.log('\n🔥 Stress Test Results:');
      this.printResults(results);

      const report = tester.generateReport();
      this.saveReport(report, 'stress-test');

    } catch (error) {
      console.error('❌ Stress test failed:', error);
      throw error;
    }
  }

  /**
   * Run endurance test (long duration, moderate load)
   */
  async runEnduranceTest(): Promise<void> {
    console.log('⏱️  Starting Multi-Drop Endurance Test');
    console.log('======================================');

    const config = this.createLoadTestConfig({
      maxUsers: 200,
      duration: 1800, // 30 minutes
      rampUp: 300     // 5 minute ramp up
    });

    const tester = new MultiDropLoadTester(config);

    try {
      const results = await tester.runLoadTests();
      
      console.log('\n🏃 Endurance Test Results:');
      this.printResults(results);

      const report = tester.generateReport();
      this.saveReport(report, 'endurance-test');

    } catch (error) {
      console.error('❌ Endurance test failed:', error);
      throw error;
    }
  }

  /**
   * Print test results summary
   */
  private printResults(results: Map<string, any>): void {
    for (const [scenario, result] of results) {
      const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1);
      
      console.log(`\n${scenario}:`);
      console.log(`  Requests: ${result.totalRequests.toLocaleString()}`);
      console.log(`  Success Rate: ${successRate}%`);
      console.log(`  Avg Response: ${result.averageResponseTime.toFixed(0)}ms`);
      console.log(`  P95 Response: ${result.p95ResponseTime.toFixed(0)}ms`);
      console.log(`  Throughput: ${result.throughput.toFixed(1)} req/s`);
    }
  }

  /**
   * Save test report to file
   */
  private saveReport(report: string, testType: string): void {
    const fs = require('fs');
    const path = require('path');

    const reportsDir = path.join(process.cwd(), 'load-test-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testType}-${timestamp}.md`;
    const filepath = path.join(reportsDir, filename);

    fs.writeFileSync(filepath, report);
    console.log(`\n📄 Report saved: ${filepath}`);
  }
}

export default MultiDropLoadTestSuite;