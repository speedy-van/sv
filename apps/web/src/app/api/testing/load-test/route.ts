/**
 * Load Testing API Endpoint
 * Provides endpoints for running performance tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLoadTester, runQuickPerformanceTest, runStressTest } from '@/lib/testing/enhanced-load-tester';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const testId = url.searchParams.get('testId');

    switch (action) {
      case 'status':
        const tester = getLoadTester();
        return NextResponse.json({
          isRunning: tester.isTestRunning(),
          availableTests: ['quick', 'stress', 'custom']
        });

      case 'results':
        const results = getLoadTester().getTestResults();
        if (testId) {
          const specificResult = results.find(r => r.testName === testId);
          if (!specificResult) {
            return NextResponse.json(
              { error: 'Test result not found' },
              { status: 404 }
            );
          }
          return NextResponse.json(specificResult);
        }
        return NextResponse.json(results);

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['status', 'results'],
          usage: {
            status: '/api/testing/load-test?action=status',
            results: '/api/testing/load-test?action=results',
            specificResult: '/api/testing/load-test?action=results&testId=Quick Performance Test'
          }
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Load test API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process load test request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, config } = body;

    if (!testType) {
      return NextResponse.json(
        { error: 'testType is required' },
        { status: 400 }
      );
    }

    const tester = getLoadTester();

    // Check if test is already running
    if (tester.isTestRunning()) {
      return NextResponse.json(
        { error: 'A load test is already running' },
        { status: 409 }
      );
    }

    let result;

    switch (testType) {
      case 'quick':
        console.log('🚀 Starting quick performance test...');
        result = await runQuickPerformanceTest();
        break;

      case 'stress':
        console.log('🚀 Starting stress test for 10K users...');
        result = await runStressTest();
        break;

      case 'custom':
        if (!config) {
          return NextResponse.json(
            { error: 'config is required for custom tests' },
            { status: 400 }
          );
        }
        console.log('🚀 Starting custom load test...');
        result = await tester.runComprehensiveTest(config);
        break;

      default:
        return NextResponse.json(
          { 
            error: 'Invalid test type',
            availableTypes: ['quick', 'stress', 'custom']
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      testId: result.testName,
      grade: result.grade,
      summary: {
        duration: result.duration,
        totalRequests: result.scenarios.reduce((sum, s) => sum + s.totalRequests, 0),
        averageResponseTime: result.systemMetrics.averageResponseTime,
        errorRate: result.systemMetrics.errorRate,
        bottlenecks: result.bottlenecks.length,
        recommendations: result.recommendations.length
      },
      result
    });

  } catch (error) {
    console.error('Load test execution error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute load test',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

