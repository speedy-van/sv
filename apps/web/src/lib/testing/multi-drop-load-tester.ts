/**
 * Comprehensive Load Testing Framework for Multi-Drop Routes
 * 
 * Advanced load testing suite for validating system performance
 * under high-stress conditions with concurrent multi-drop operations
 */

import { performance } from 'perf_hooks';
import axios, { AxiosInstance } from 'axios';

interface LoadTestConfig {
  baseUrl: string;
  maxConcurrentUsers: number;
  testDuration: number; // seconds
  rampUpTime: number; // seconds
  scenarios: LoadTestScenario[];
}

interface LoadTestScenario {
  name: string;
  weight: number; // percentage of total load
  endpoints: EndpointTest[];
  userBehavior: UserBehaviorPattern;
}

interface EndpointTest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload?: any;
  headers?: Record<string, string>;
  expectedStatusCodes: number[];
  timeoutMs: number;
  retries: number;
}

interface UserBehaviorPattern {
  thinkTime: { min: number; max: number }; // milliseconds between requests
  sessionDuration: { min: number; max: number }; // seconds
  requestsPerSession: { min: number; max: number };
}

interface LoadTestResult {
  scenario: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number; // requests per second
  errorRate: number;
  errors: Record<string, number>;
  memoryUsage: NodeJS.MemoryUsage;
  cpuMetrics: any;
}

class MultiDropLoadTester {
  private config: LoadTestConfig;
  private httpClient: AxiosInstance;
  private activeUsers: number = 0;
  private totalRequests: number = 0;
  private results: Map<string, LoadTestResult> = new Map();
  private isRunning: boolean = false;

  constructor(config: LoadTestConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MultiDrop-LoadTester/1.0'
      }
    });
  }

  /**
   * Execute comprehensive load testing suite
   */
  async runLoadTests(): Promise<Map<string, LoadTestResult>> {
    console.log('🚀 Starting Multi-Drop Route Load Testing');
    console.log('==========================================');
    console.log(`Target: ${this.config.baseUrl}`);
    console.log(`Max Users: ${this.config.maxConcurrentUsers}`);
    console.log(`Duration: ${this.config.testDuration}s`);
    console.log(`Scenarios: ${this.config.scenarios.length}`);

    this.isRunning = true;
    const startTime = performance.now();

    try {
      // Initialize monitoring
      this.startSystemMonitoring();

      // Run scenarios concurrently
      const scenarioPromises = this.config.scenarios.map(scenario =>
        this.runScenario(scenario)
      );

      await Promise.all(scenarioPromises);

      const totalTime = (performance.now() - startTime) / 1000;
      console.log(`\n✅ Load testing completed in ${totalTime.toFixed(2)}s`);

      return this.results;

    } catch (error) {
      console.error('❌ Load testing failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.stopSystemMonitoring();
    }
  }

  /**
   * Run individual load test scenario
   */
  private async runScenario(scenario: LoadTestScenario): Promise<void> {
    console.log(`\n📊 Starting scenario: ${scenario.name}`);
    
    const maxUsersForScenario = Math.floor(
      (this.config.maxConcurrentUsers * scenario.weight) / 100
    );

    const scenarioResult: LoadTestResult = {
      scenario: scenario.name,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      throughput: 0,
      errorRate: 0,
      errors: {},
      memoryUsage: process.memoryUsage(),
      cpuMetrics: {}
    };

    const responseTimes: number[] = [];
    const errors: Record<string, number> = {};
    let activeScenarioUsers = 0;

    const startTime = performance.now();
    const endTime = startTime + (this.config.testDuration * 1000);

    // Ramp up users gradually
    const rampUpInterval = (this.config.rampUpTime * 1000) / maxUsersForScenario;

    const userPromises: Promise<void>[] = [];

    for (let i = 0; i < maxUsersForScenario; i++) {
      await new Promise(resolve => setTimeout(resolve, rampUpInterval));
      
      if (performance.now() > endTime) break;

      activeScenarioUsers++;
      this.activeUsers++;

      const userPromise = this.simulateUser(
        scenario,
        endTime,
        responseTimes,
        errors,
        scenarioResult
      ).finally(() => {
        activeScenarioUsers--;
        this.activeUsers--;
      });

      userPromises.push(userPromise);
    }

    // Wait for all users to complete
    await Promise.all(userPromises);

    // Calculate final statistics
    this.calculateScenarioResults(scenarioResult, responseTimes, errors);
    this.results.set(scenario.name, scenarioResult);

    console.log(`✅ Scenario ${scenario.name} completed:`);
    console.log(`   Requests: ${scenarioResult.totalRequests}`);
    console.log(`   Success Rate: ${((scenarioResult.successfulRequests / scenarioResult.totalRequests) * 100).toFixed(1)}%`);
    console.log(`   Avg Response: ${scenarioResult.averageResponseTime.toFixed(0)}ms`);
    console.log(`   Throughput: ${scenarioResult.throughput.toFixed(1)} req/s`);
  }

  /**
   * Simulate individual user behavior
   */
  private async simulateUser(
    scenario: LoadTestScenario,
    endTime: number,
    responseTimes: number[],
    errors: Record<string, number>,
    result: LoadTestResult
  ): Promise<void> {
    const sessionDuration = this.randomBetween(
      scenario.userBehavior.sessionDuration.min * 1000,
      scenario.userBehavior.sessionDuration.max * 1000
    );

    const sessionEndTime = Math.min(
      performance.now() + sessionDuration,
      endTime
    );

    const requestsInSession = this.randomBetween(
      scenario.userBehavior.requestsPerSession.min,
      scenario.userBehavior.requestsPerSession.max
    );

    let requestsCompleted = 0;

    while (performance.now() < sessionEndTime && requestsCompleted < requestsInSession) {
      // Select random endpoint from scenario
      const endpoint = scenario.endpoints[
        Math.floor(Math.random() * scenario.endpoints.length)
      ];

      try {
        const requestStart = performance.now();
        
        const response = await this.httpClient.request({
          method: endpoint.method,
          url: endpoint.path,
          data: endpoint.payload,
          headers: endpoint.headers,
          timeout: endpoint.timeoutMs
        });

        const responseTime = performance.now() - requestStart;
        responseTimes.push(responseTime);

        result.totalRequests++;
        this.totalRequests++;

        if (endpoint.expectedStatusCodes.includes(response.status)) {
          result.successfulRequests++;
        } else {
          result.failedRequests++;
          const errorKey = `Unexpected status: ${response.status}`;
          errors[errorKey] = (errors[errorKey] || 0) + 1;
        }

        requestsCompleted++;

        // Think time between requests
        const thinkTime = this.randomBetween(
          scenario.userBehavior.thinkTime.min,
          scenario.userBehavior.thinkTime.max
        );
        await new Promise(resolve => setTimeout(resolve, thinkTime));

      } catch (error) {
        result.totalRequests++;
        result.failedRequests++;
        this.totalRequests++;

        const errorKey = error instanceof Error ? error.message : 'Unknown error';
        errors[errorKey] = (errors[errorKey] || 0) + 1;

        requestsCompleted++;
      }
    }
  }

  /**
   * Calculate final scenario statistics
   */
  private calculateScenarioResults(
    result: LoadTestResult,
    responseTimes: number[],
    errors: Record<string, number>
  ): void {
    if (responseTimes.length === 0) return;

    responseTimes.sort((a, b) => a - b);

    result.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    result.p50ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.5)];
    result.p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
    result.p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];
    result.minResponseTime = responseTimes[0];
    result.maxResponseTime = responseTimes[responseTimes.length - 1];
    result.throughput = result.totalRequests / this.config.testDuration;
    result.errorRate = (result.failedRequests / result.totalRequests) * 100;
    result.errors = errors;
    result.memoryUsage = process.memoryUsage();
  }

  /**
   * Start system resource monitoring
   */
  private startSystemMonitoring(): void {
    console.log('📊 Starting system monitoring...');
    
    // Monitor memory usage, CPU, etc.
    // This would integrate with system monitoring tools
  }

  /**
   * Stop system resource monitoring
   */
  private stopSystemMonitoring(): void {
    console.log('📊 Stopping system monitoring...');
  }

  /**
   * Generate random number between min and max
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate comprehensive load test report
   */
  generateReport(): string {
    const report = [
      '# Multi-Drop Route Load Testing Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Test Configuration',
      `- Base URL: ${this.config.baseUrl}`,
      `- Max Concurrent Users: ${this.config.maxConcurrentUsers}`,
      `- Test Duration: ${this.config.testDuration}s`,
      `- Ramp Up Time: ${this.config.rampUpTime}s`,
      '',
      '## Overall Results',
      ''
    ];

    let totalRequests = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let avgResponseTime = 0;

    for (const [scenarioName, result] of this.results) {
      totalRequests += result.totalRequests;
      totalSuccessful += result.successfulRequests;
      totalFailed += result.failedRequests;
      avgResponseTime += result.averageResponseTime;
    }

    avgResponseTime = avgResponseTime / this.results.size;
    const overallSuccessRate = ((totalSuccessful / totalRequests) * 100).toFixed(1);

    report.push(`**Total Requests**: ${totalRequests.toLocaleString()}`);
    report.push(`**Success Rate**: ${overallSuccessRate}%`);
    report.push(`**Average Response Time**: ${avgResponseTime.toFixed(0)}ms`);
    report.push(`**Total Throughput**: ${(totalRequests / this.config.testDuration).toFixed(1)} req/s`);
    report.push('');

    // Detailed scenario results
    report.push('## Scenario Results');
    report.push('');

    for (const [scenarioName, result] of this.results) {
      const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1);
      
      report.push(`### ${scenarioName}`);
      report.push(`- **Requests**: ${result.totalRequests.toLocaleString()}`);
      report.push(`- **Success Rate**: ${successRate}%`);
      report.push(`- **Avg Response Time**: ${result.averageResponseTime.toFixed(0)}ms`);
      report.push(`- **P95 Response Time**: ${result.p95ResponseTime.toFixed(0)}ms`);
      report.push(`- **P99 Response Time**: ${result.p99ResponseTime.toFixed(0)}ms`);
      report.push(`- **Throughput**: ${result.throughput.toFixed(1)} req/s`);
      report.push(`- **Error Rate**: ${result.errorRate.toFixed(2)}%`);
      
      if (Object.keys(result.errors).length > 0) {
        report.push('- **Top Errors**:');
        Object.entries(result.errors)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .forEach(([error, count]) => {
            report.push(`  - ${error}: ${count} occurrences`);
          });
      }
      
      report.push('');
    }

    return report.join('\n');
  }
}

export { MultiDropLoadTester, type LoadTestConfig, type LoadTestScenario, type LoadTestResult };