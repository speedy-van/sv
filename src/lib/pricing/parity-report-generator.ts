/**
 * Parity Report Generator - Zero-Tolerance Data Parity Enforcement
 *
 * Generates comprehensive parity reports to ensure 1:1 match between
 * booking-luxury and enterprise pricing engine with deep validation.
 */

import { ContractTestSuite, ContractTestResult, TEST_SCENARIOS } from './contract-tests';
import { parityValidator } from './parity-validator';
import { unifiedPricingEngine } from './unified-engine';
import { multiDropRoutingService } from '../services/multi-drop-routing-service';
import { pricingSnapshotService } from '../services/pricing-snapshot-service';
import * as fs from 'fs';
import * as path from 'path';

interface ParityReport {
  generatedAt: string;
  version: string;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
    totalDuration: number;
  };
  testResults: ContractTestResult[];
  parityMetrics: {
    averageParityScore: number;
    fieldConsistencyScore: number;
    typeSafetyScore: number;
    stripeIntegrityScore: number;
  };
  recommendations: string[];
  validationChecklist: {
    dataParity: boolean;
    schemaValidation: boolean;
    threeTierPricing: boolean;
    multiDropRouting: boolean;
    stripeIntegrity: boolean;
    contractTests: boolean;
  };
}

export class ParityReportGenerator {

  /**
   * Generate comprehensive parity report
   */
  static async generateFullReport(): Promise<ParityReport> {
    console.log('🔬 Generating Comprehensive Parity Report...');

    const startTime = Date.now();
    const testResults = await ContractTestSuite.runAllTests();
    const totalDuration = Date.now() - startTime;

    // Calculate summary metrics
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const successRate = (passedTests / totalTests) * 100;

    // Calculate parity metrics
    const parityMetrics = this.calculateParityMetrics(testResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations(testResults);

    // Validate checklist items
    const validationChecklist = this.validateChecklist(testResults);

    const report: ParityReport = {
      generatedAt: new Date().toISOString(),
      version: '2.0.0',
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate,
        totalDuration
      },
      testResults,
      parityMetrics,
      recommendations,
      validationChecklist
    };

    // Save report to file
    await this.saveReportToFile(report);

    console.log('✅ Parity Report Generated Successfully');
    console.log(`📊 Summary: ${passedTests}/${totalTests} tests passed (${successRate.toFixed(1)}%)`);

    return report;
  }

  /**
   * Generate quick parity check for CI/CD
   */
  static async generateQuickParityCheck(): Promise<{
    passed: boolean;
    criticalFailures: string[];
    warnings: string[];
  }> {
    console.log('⚡ Running Quick Parity Check...');

    const criticalFailures: string[] = [];
    const warnings: string[] = [];

    try {
      // Run critical test scenarios only
      const criticalScenarios = ['basicSingle', 'multiDrop'];
      const results: ContractTestResult[] = [];

      for (const scenarioName of criticalScenarios) {
        if (scenarioName in TEST_SCENARIOS) {
          const result = await ContractTestSuite.runSingleTest(scenarioName, TEST_SCENARIOS[scenarioName as keyof typeof TEST_SCENARIOS]);
          results.push(result);

          if (!result.passed) {
            criticalFailures.push(`${scenarioName}: ${result.errors.join(', ')}`);
          }

          if (result.warnings.length > 0) {
            warnings.push(`${scenarioName}: ${result.warnings.join(', ')}`);
          }
        }
      }

      // Check if any critical parity issues exist
      const hasCriticalFailures = criticalFailures.length > 0;

      if (hasCriticalFailures) {
        console.error('❌ Critical parity failures detected:', criticalFailures);
      } else {
        console.log('✅ Quick parity check passed');
      }

      return {
        passed: !hasCriticalFailures,
        criticalFailures,
        warnings
      };

    } catch (error) {
      console.error('❌ Quick parity check failed:', error);
      return {
        passed: false,
        criticalFailures: [`Quick check error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Calculate detailed parity metrics
   */
  private static calculateParityMetrics(results: ContractTestResult[]): ParityReport['parityMetrics'] {
    const validResults = results.filter(r => r.parityCheck);

    if (validResults.length === 0) {
      return {
        averageParityScore: 0,
        fieldConsistencyScore: 0,
        typeSafetyScore: 0,
        stripeIntegrityScore: 0
      };
    }

    // Calculate average parity score (based on parity check results)
    const parityScores = validResults.map(r => {
      const errorCount = r.parityCheck!.errors.length;
      const warningCount = r.parityCheck!.warnings.length;
      return Math.max(0, 100 - (errorCount * 10) - (warningCount * 2));
    });

    const averageParityScore = parityScores.reduce((sum, score) => sum + score, 0) / parityScores.length;

    // Calculate field consistency score (based on structure validation)
    const fieldConsistencyScores = validResults.map(r => {
      const structureErrors = r.parityCheck!.errors.filter(e => e.field.includes('structure') || e.field.includes('schema')).length;
      return Math.max(0, 100 - (structureErrors * 20));
    });

    const fieldConsistencyScore = fieldConsistencyScores.reduce((sum, score) => sum + score, 0) / fieldConsistencyScores.length;

    // Calculate type safety score (based on type validation)
    const typeSafetyScores = validResults.map(r => {
      const typeErrors = r.parityCheck!.errors.filter(e => e.field.includes('type') || e.message.includes('type')).length;
      return Math.max(0, 100 - (typeErrors * 15));
    });

    const typeSafetyScore = typeSafetyScores.reduce((sum, score) => sum + score, 0) / typeSafetyScores.length;

    // Calculate Stripe integrity score (based on amount validation)
    const stripeIntegrityScores = validResults.map(r => {
      const amountErrors = r.parityCheck!.errors.filter(e => e.field.includes('amount') || e.message.includes('pence')).length;
      return Math.max(0, 100 - (amountErrors * 25));
    });

    const stripeIntegrityScore = stripeIntegrityScores.reduce((sum, score) => sum + score, 0) / stripeIntegrityScores.length;

    return {
      averageParityScore,
      fieldConsistencyScore,
      typeSafetyScore,
      stripeIntegrityScore
    };
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(results: ContractTestResult[]): string[] {
    const recommendations: string[] = [];

    const failedTests = results.filter(r => !r.passed);

    if (failedTests.length > 0) {
      recommendations.push(`Fix ${failedTests.length} failing contract tests to restore data parity`);

      // Analyze common failure patterns
      const commonErrors = this.analyzeCommonErrors(failedTests);
      if (commonErrors.length > 0) {
        recommendations.push(`Common issues detected: ${commonErrors.join(', ')}`);
      }
    }

    // Check for warnings across all tests
    const testsWithWarnings = results.filter(r => r.warnings.length > 0);
    if (testsWithWarnings.length > 0) {
      recommendations.push(`${testsWithWarnings.length} tests have warnings that should be addressed`);
    }

    // Performance recommendations
    const slowTests = results.filter(r => r.duration > 1000); // > 1 second
    if (slowTests.length > 0) {
      recommendations.push(`Optimize ${slowTests.length} slow-running tests for better CI/CD performance`);
    }

    // Coverage recommendations
    const uncoveredScenarios = this.identifyMissingScenarios(results);
    if (uncoveredScenarios.length > 0) {
      recommendations.push(`Add test coverage for: ${uncoveredScenarios.join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Validate checklist items
   */
  private static validateChecklist(results: ContractTestResult[]): ParityReport['validationChecklist'] {
    const hasBasicTest = results.some(r => r.testName === 'basicSingle' && r.passed);
    const hasMultiDropTest = results.some(r => r.testName === 'multiDrop' && r.passed);
    const hasOverCapacityTest = results.some(r => r.testName === 'overCapacity');
    const hasFutureDateTest = results.some(r => r.testName === 'futureDate');

    // All tests should pass for data parity
    const dataParity = results.every(r => r.passed);

    // Schema validation is built into the parity validator
    const schemaValidation = results.every(r => r.parityCheck?.passed !== false);

    // Three-tier pricing should be validated in tests
    const threeTierPricing = hasBasicTest && hasMultiDropTest;

    // Multi-drop routing should be validated
    const multiDropRouting = hasMultiDropTest && results.some(r =>
      r.testName === 'multiDrop' &&
      r.pricingResult?.metadata?.recommendations?.some((rec: string) => rec.includes('multi-drop'))
    );

    // Stripe integrity should be validated
    const stripeIntegrity = results.every(r =>
      r.parityCheck?.errors.every(e => !e.message.includes('pence') && !e.message.includes('amount'))
    );

    // Contract tests should all pass
    const contractTests = results.every(r => r.passed);

    return {
      dataParity,
      schemaValidation,
      threeTierPricing,
      multiDropRouting,
      stripeIntegrity,
      contractTests
    };
  }

  /**
   * Analyze common error patterns
   */
  private static analyzeCommonErrors(failedTests: ContractTestResult[]): string[] {
    const errorPatterns: Record<string, number> = {};

    failedTests.forEach(test => {
      test.errors.forEach(error => {
        const key = error.toLowerCase();
        errorPatterns[key] = (errorPatterns[key] || 0) + 1;
      });
    });

    return Object.entries(errorPatterns)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, _]) => error);
  }

  /**
   * Identify missing test scenarios
   */
  private static identifyMissingScenarios(results: ContractTestResult[]): string[] {
    const testedScenarios = new Set(results.map(r => r.testName));
    const allScenarios = Object.keys(TEST_SCENARIOS);

    return allScenarios.filter(scenario => !testedScenarios.has(scenario));
  }

  /**
   * Save report to file
   */
  private static async saveReportToFile(report: ParityReport): Promise<void> {
    const reportDir = path.join(process.cwd(), 'parity-reports');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `parity-report-${timestamp}.json`;

    try {
      // Ensure directory exists
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      // Write report
      const reportPath = path.join(reportDir, filename);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      // Also create a human-readable markdown report
      const markdownReport = this.generateMarkdownReport(report);
      const markdownPath = path.join(reportDir, `parity-report-${timestamp}.md`);
      fs.writeFileSync(markdownPath, markdownReport);

      console.log(`📄 Reports saved to: ${reportDir}`);
      console.log(`   - JSON: ${filename}`);
      console.log(`   - Markdown: ${path.basename(markdownPath)}`);

    } catch (error) {
      console.error('Failed to save parity report:', error);
    }
  }

  /**
   * Generate human-readable markdown report
   */
  private static generateMarkdownReport(report: ParityReport): string {
    let markdown = '# 🔬 Data Parity Report\n\n';
    markdown += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}\n`;
    markdown += `**Version:** ${report.version}\n\n`;

    markdown += '## 📊 Summary\n\n';
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Tests | ${report.summary.totalTests} |\n`;
    markdown += `| Passed Tests | ${report.summary.passedTests} |\n`;
    markdown += `| Failed Tests | ${report.summary.failedTests} |\n`;
    markdown += `| Success Rate | ${report.summary.successRate.toFixed(1)}% |\n`;
    markdown += `| Total Duration | ${report.summary.totalDuration}ms |\n\n`;

    markdown += '## 🎯 Parity Metrics\n\n';
    markdown += `| Metric | Score |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Average Parity Score | ${report.parityMetrics.averageParityScore.toFixed(1)}% |\n`;
    markdown += `| Field Consistency Score | ${report.parityMetrics.fieldConsistencyScore.toFixed(1)}% |\n`;
    markdown += `| Type Safety Score | ${report.parityMetrics.typeSafetyScore.toFixed(1)}% |\n`;
    markdown += `| Stripe Integrity Score | ${report.parityMetrics.stripeIntegrityScore.toFixed(1)}% |\n\n`;

    markdown += '## ✅ Validation Checklist\n\n';
    markdown += `| Component | Status |\n`;
    markdown += `|-----------|--------|\n`;
    Object.entries(report.validationChecklist).forEach(([key, value]) => {
      const status = value ? '✅ PASS' : '❌ FAIL';
      markdown += `| ${key} | ${status} |\n`;
    });
    markdown += '\n';

    if (report.recommendations.length > 0) {
      markdown += '## 💡 Recommendations\n\n';
      report.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }

    markdown += '## 🧪 Test Results\n\n';
    report.testResults.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      markdown += `### ${status} ${test.testName}\n`;
      markdown += `- **Duration:** ${test.duration}ms\n`;
      markdown += `- **Parity Check:** ${test.parityCheck?.passed ? 'PASS' : 'FAIL'}\n`;

      if (test.errors.length > 0) {
        markdown += `- **Errors:**\n`;
        test.errors.forEach(error => {
          markdown += `  - ${error}\n`;
        });
      }

      if (test.warnings.length > 0) {
        markdown += `- **Warnings:**\n`;
        test.warnings.forEach(warning => {
          markdown += `  - ${warning}\n`;
        });
      }

      markdown += '\n';
    });

    return markdown;
  }

  /**
   * Validate deployment readiness based on parity report
   */
  static validateDeploymentReadiness(report: ParityReport): {
    ready: boolean;
    blockingIssues: string[];
    warnings: string[];
  } {
    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    // Critical requirements that must pass
    if (!report.validationChecklist.dataParity) {
      blockingIssues.push('Data parity validation failed - cannot deploy');
    }

    if (!report.validationChecklist.schemaValidation) {
      blockingIssues.push('Schema validation failed - cannot deploy');
    }

    if (!report.validationChecklist.contractTests) {
      blockingIssues.push('Contract tests failed - cannot deploy');
    }

    if (report.summary.successRate < 90) {
      blockingIssues.push(`Success rate too low (${report.summary.successRate.toFixed(1)}%) - minimum 90% required`);
    }

    // Non-blocking but important warnings
    if (!report.validationChecklist.threeTierPricing) {
      warnings.push('Three-tier pricing not fully validated');
    }

    if (!report.validationChecklist.multiDropRouting) {
      warnings.push('Multi-drop routing not fully validated');
    }

    if (!report.validationChecklist.stripeIntegrity) {
      warnings.push('Stripe integrity not fully validated');
    }

    const ready = blockingIssues.length === 0;

    if (ready) {
      console.log('🚀 Deployment readiness: PASSED');
    } else {
      console.error('❌ Deployment readiness: FAILED');
      console.error('Blocking issues:', blockingIssues);
    }

    return {
      ready,
      blockingIssues,
      warnings
    };
  }
}

// Export types for external use
export type { ParityReport };
