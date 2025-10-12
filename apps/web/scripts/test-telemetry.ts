#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

async function testTelemetryEndpoints(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('🧪 Testing Telemetry System...\n');

  // Test 1: Analytics endpoint
  try {
    const analyticsResponse = await fetch(
      `${baseUrl}/api/telemetry/analytics`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test_event',
          properties: { test: true },
          sessionId: 'test-session-123',
          timestamp: Date.now(),
          environment: 'test',
        }),
      }
    );

    if (analyticsResponse.ok) {
      const data = await analyticsResponse.json();
      results.push({
        test: 'Analytics Endpoint',
        passed: true,
        message: 'Successfully sent analytics event',
        data: data,
      });
    } else {
      results.push({
        test: 'Analytics Endpoint',
        passed: false,
        message: `Failed with status: ${analyticsResponse.status}`,
      });
    }
  } catch (error) {
    results.push({
      test: 'Analytics Endpoint',
      passed: false,
      message: `Error: ${error}`,
    });
  }

  // Test 2: Performance endpoint
  try {
    const performanceResponse = await fetch(
      `${baseUrl}/api/telemetry/performance`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'test_performance',
          value: 100,
          unit: 'milliseconds',
          tags: { test: 'true' },
          timestamp: Date.now(),
          environment: 'test',
        }),
      }
    );

    if (performanceResponse.ok) {
      const data = await performanceResponse.json();
      results.push({
        test: 'Performance Endpoint',
        passed: true,
        message: 'Successfully sent performance metric',
        data: data,
      });
    } else {
      results.push({
        test: 'Performance Endpoint',
        passed: false,
        message: `Failed with status: ${performanceResponse.status}`,
      });
    }
  } catch (error) {
    results.push({
      test: 'Performance Endpoint',
      passed: false,
      message: `Error: ${error}`,
    });
  }

  // Test 3: Business metrics endpoint
  try {
    const businessResponse = await fetch(`${baseUrl}/api/telemetry/business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'test_business_metric',
        value: 1,
        category: 'test',
        tags: { test: 'true' },
        timestamp: Date.now(),
        environment: 'test',
      }),
    });

    if (businessResponse.ok) {
      const data = await businessResponse.json();
      results.push({
        test: 'Business Metrics Endpoint',
        passed: true,
        message: 'Successfully sent business metric',
        data: data,
      });
    } else {
      results.push({
        test: 'Business Metrics Endpoint',
        passed: false,
        message: `Failed with status: ${businessResponse.status}`,
      });
    }
  } catch (error) {
    results.push({
      test: 'Business Metrics Endpoint',
      passed: false,
      message: `Error: ${error}`,
    });
  }

  return results;
}

async function testDatabaseSchema(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('🗄️ Testing Database Schema...\n');

  // Test 1: Check if telemetry tables exist
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('telemetry_events', 'performance_metrics', 'business_metrics')
    `;

    const expectedTables = [
      'telemetry_events',
      'performance_metrics',
      'business_metrics',
    ];
    const foundTables = (tables as any[]).map(t => t.table_name);

    const missingTables = expectedTables.filter(
      table => !foundTables.includes(table)
    );

    if (missingTables.length === 0) {
      results.push({
        test: 'Database Tables',
        passed: true,
        message: 'All required telemetry tables exist',
        data: foundTables,
      });
    } else {
      results.push({
        test: 'Database Tables',
        passed: false,
        message: `Missing tables: ${missingTables.join(', ')}`,
        data: { expected: expectedTables, found: foundTables },
      });
    }
  } catch (error) {
    results.push({
      test: 'Database Tables',
      passed: false,
      message: `Database connection error: ${error}`,
    });
  }

  // Test 2: Check table structure
  try {
    const eventColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'telemetry_events'
    `;

    const requiredColumns = [
      'id',
      'event',
      'properties',
      'user_id',
      'session_id',
      'timestamp',
    ];
    const foundColumns = (eventColumns as any[]).map(c => c.column_name);

    const missingColumns = requiredColumns.filter(
      col => !foundColumns.includes(col)
    );

    if (missingColumns.length === 0) {
      results.push({
        test: 'Telemetry Events Schema',
        passed: true,
        message: 'All required columns exist in telemetry_events table',
        data: foundColumns,
      });
    } else {
      results.push({
        test: 'Telemetry Events Schema',
        passed: false,
        message: `Missing columns: ${missingColumns.join(', ')}`,
        data: { expected: requiredColumns, found: foundColumns },
      });
    }
  } catch (error) {
    results.push({
      test: 'Telemetry Events Schema',
      passed: false,
      message: `Schema check error: ${error}`,
    });
  }

  return results;
}

async function testCustomerPortalMetrics(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('📊 Testing Customer Portal Metrics...\n');

  // Test 1: Portal load time tracking
  try {
    const portalLoadMetric = await prisma.performanceMetric.findFirst({
      where: {
        name: 'customer_portal_load_time',
        tags: {
          path: ['portal'],
          equals: 'customer',
        },
      },
    });

    if (portalLoadMetric) {
      results.push({
        test: 'Portal Load Time Tracking',
        passed: true,
        message: 'Portal load time metrics are being tracked',
        data: { value: portalLoadMetric.value, unit: portalLoadMetric.unit },
      });
    } else {
      results.push({
        test: 'Portal Load Time Tracking',
        passed: false,
        message: 'No portal load time metrics found',
      });
    }
  } catch (error) {
    results.push({
      test: 'Portal Load Time Tracking',
      passed: false,
      message: `Error checking portal load metrics: ${error}`,
    });
  }

  // Test 2: Time to first content tracking
  try {
    const ttfcMetric = await prisma.performanceMetric.findFirst({
      where: {
        name: 'time_to_first_content',
      },
    });

    if (ttfcMetric) {
      results.push({
        test: 'Time to First Content',
        passed: true,
        message: 'Time to first content metrics are being tracked',
        data: { value: ttfcMetric.value, unit: ttfcMetric.unit },
      });
    } else {
      results.push({
        test: 'Time to First Content',
        passed: false,
        message: 'No time to first content metrics found',
      });
    }
  } catch (error) {
    results.push({
      test: 'Time to First Content',
      passed: false,
      message: `Error checking TTFC metrics: ${error}`,
    });
  }

  // Test 3: Sign-in success rate tracking
  try {
    const signInEvents = await prisma.telemetryEvent.findMany({
      where: {
        event: 'auth_sign_in_success',
      },
    });

    if (signInEvents.length > 0) {
      results.push({
        test: 'Sign-in Success Tracking',
        passed: true,
        message: `Found ${signInEvents.length} sign-in success events`,
        data: { count: signInEvents.length },
      });
    } else {
      results.push({
        test: 'Sign-in Success Tracking',
        passed: false,
        message: 'No sign-in success events found',
      });
    }
  } catch (error) {
    results.push({
      test: 'Sign-in Success Tracking',
      passed: false,
      message: `Error checking sign-in events: ${error}`,
    });
  }

  // Test 4: API error rate tracking
  try {
    const apiErrorEvents = await prisma.telemetryEvent.findMany({
      where: {
        event: 'api_error',
      },
    });

    if (apiErrorEvents.length > 0) {
      results.push({
        test: 'API Error Tracking',
        passed: true,
        message: `Found ${apiErrorEvents.length} API error events`,
        data: { count: apiErrorEvents.length },
      });
    } else {
      results.push({
        test: 'API Error Tracking',
        passed: false,
        message: 'No API error events found (this might be good!)',
      });
    }
  } catch (error) {
    results.push({
      test: 'API Error Tracking',
      passed: false,
      message: `Error checking API error events: ${error}`,
    });
  }

  return results;
}

async function main() {
  try {
    console.log('🚀 Starting Telemetry System Tests\n');

    const endpointResults = await testTelemetryEndpoints();
    const schemaResults = await testDatabaseSchema();
    const metricsResults = await testCustomerPortalMetrics();

    const allResults = [
      ...endpointResults,
      ...schemaResults,
      ...metricsResults,
    ];

    // Print results
    console.log('📋 Test Results:\n');

    allResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      console.log(`   ${result.message}`);
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
      }
      console.log('');
    });

    const passedTests = allResults.filter(r => r.passed).length;
    const totalTests = allResults.length;
    const successRate = (passedTests / totalTests) * 100;

    console.log(
      `📊 Summary: ${passedTests}/${totalTests} tests passed (${successRate.toFixed(1)}%)`
    );

    if (successRate >= 80) {
      console.log('🎉 Telemetry system is working well!');
      process.exit(0);
    } else {
      console.log(
        '⚠️ Some telemetry tests failed. Please check the implementation.'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
