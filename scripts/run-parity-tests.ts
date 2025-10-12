#!/usr/bin/env tsx

/**
 * Parity Test Runner Script
 *
 * Runs comprehensive contract tests and generates parity reports
 * for zero-tolerance data parity enforcement.
 */

import { ParityReportGenerator } from '../src/lib/pricing/parity-report-generator';
import { ContractTestSuite } from '../src/lib/pricing/contract-tests';
// import { config } from 'dotenv'; // Not needed for this script

// Environment variables are loaded automatically by the runtime

async function main() {
  console.log('🚀 Speedy Van - Zero-Tolerance Data Parity Test Suite');
  console.log('===================================================\n');

  try {
    // Check if we should run full report or quick check
    const args = process.argv.slice(2);
    const runQuickCheck = args.includes('--quick') || args.includes('-q');
    const runFullReport = args.includes('--full') || args.includes('-f');

    if (runQuickCheck) {
      console.log('⚡ Running Quick Parity Check...\n');
      const quickCheck = await ParityReportGenerator.generateQuickParityCheck();

      if (quickCheck.passed) {
        console.log('✅ Quick parity check passed!');
        process.exit(0);
      } else {
        console.error('❌ Quick parity check failed:');
        quickCheck.criticalFailures.forEach(failure => console.error(`  - ${failure}`));
        process.exit(1);
      }
    } else {
      console.log('🔬 Running Full Parity Report...\n');
      const report = await ParityReportGenerator.generateFullReport();

      // Validate deployment readiness
      const deploymentCheck = ParityReportGenerator.validateDeploymentReadiness(report);

      if (deploymentCheck.ready) {
        console.log('\n🎉 All parity checks passed! Ready for deployment.');
        process.exit(0);
      } else {
        console.error('\n❌ Deployment blocked due to parity issues:');
        deploymentCheck.blockingIssues.forEach(issue => console.error(`  - ${issue}`));

        if (deploymentCheck.warnings.length > 0) {
          console.warn('\n⚠️  Additional warnings:');
          deploymentCheck.warnings.forEach(warning => console.warn(`  - ${warning}`));
        }

        process.exit(1);
      }
    }

  } catch (error) {
    console.error('\n💥 Parity test execution failed:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the script
main().catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
