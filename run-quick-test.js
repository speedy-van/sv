#!/usr/bin/env node

/**
 * Quick Test Runner for Multiple Drops Route System
 * مشغل الاختبارات السريع لنظام الطرق متعددة التوصيل
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

/**
 * Check if Node.js is installed
 */
function checkNodeJS() {
  try {
    const version = execSync('node --version', { encoding: 'utf8' });
    logInfo(`Node.js version: ${version.trim()}`);
    return true;
  } catch (error) {
    logError('Node.js is not installed. Please install Node.js first.');
    return false;
  }
}

/**
 * Check if test files exist
 */
function checkTestFiles() {
  const requiredFiles = [
    'test-multiple-drops.js',
    '__tests__/temp/test-data-generator.ts',
    '__tests__/temp/performance-monitor.ts',
    '__tests__/temp/integration-tester.ts',
    '__tests__/temp/test-runner.ts'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    logError(`Missing required files: ${missingFiles.join(', ')}`);
    return false;
  }

  logSuccess('All required test files found');
  return true;
}

/**
 * Create temp directory if it doesn't exist
 */
function ensureTempDirectory() {
  const tempDir = path.join(__dirname, '__tests__', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    logInfo(`Created temp directory: ${tempDir}`);
  }
}

/**
 * Run specific test
 */
async function runTest(testType) {
  logHeader(`🧪 RUNNING ${testType.toUpperCase()} TEST`);
  
  try {
    const command = `node test-multiple-drops.js --test-type ${testType}`;
    logInfo(`Executing: ${command}`);
    
    const startTime = Date.now();
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    const endTime = Date.now();
    
    const duration = (endTime - startTime) / 1000;
    logSuccess(`${testType.toUpperCase()} test completed in ${duration.toFixed(1)}s`);
    
    return { success: true, duration };
    
  } catch (error) {
    logError(`${testType.toUpperCase()} test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  logHeader('🔄 RUNNING ALL TESTS');
  
  const testTypes = ['smoke', 'basic', 'advanced', 'complex', 'load', 'full'];
  const results = [];
  
  for (const testType of testTypes) {
    const result = await runTest(testType);
    results.push({ testType, ...result });
    
    if (!result.success && testType === 'smoke') {
      logError('Smoke test failed - stopping execution');
      break;
    }
  }
  
  // Generate summary
  const successfulTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  const successRate = successfulTests / totalTests;
  
  logHeader('📊 TEST SUMMARY');
  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Successful: ${successfulTests}`, 'green');
  log(`Failed: ${totalTests - successfulTests}`, 'red');
  log(`Success Rate: ${(successRate * 100).toFixed(1)}%`, successRate > 0.9 ? 'green' : 'yellow');
  
  return { results, successRate, totalTests, successfulTests };
}

/**
 * Display help information
 */
function displayHelp() {
  logHeader('📖 HELP - MULTIPLE DROPS ROUTE SYSTEM TEST SUITE');
  
  log(`
Usage: node run-quick-test.js [options]

Options:
  --test-type <type>    Run specific test type
  --help               Show this help message

Test Types:
  smoke     - Quick smoke test (1 minute)
  basic     - Basic functionality test (5 minutes)
  advanced  - Advanced features test (10 minutes)
  complex   - Complex scenarios test (15 minutes)
  load      - Load and stress test (10 minutes)
  full      - Complete test suite (30 minutes)
  all       - Run all tests

Examples:
  node run-quick-test.js                    # Run all tests
  node run-quick-test.js --test-type smoke  # Run smoke test only
  node run-quick-test.js --test-type load   # Run load test only
  node run-quick-test.js --help            # Show this help

Features:
  ✅ Comprehensive test coverage
  ✅ Performance monitoring
  ✅ Load testing
  ✅ Integration testing
  ✅ Emergency scenarios
  ✅ Detailed reporting
  ✅ Export results
`, 'cyan');
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    testType: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--test-type':
        options.testType = args[i + 1];
        i++;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        logWarning(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

/**
 * Main execution function
 */
async function main() {
  logHeader('🚀 MULTIPLE DROPS ROUTE SYSTEM - QUICK TEST RUNNER');
  
  // Check prerequisites
  if (!checkNodeJS()) {
    process.exit(1);
  }
  
  if (!checkTestFiles()) {
    process.exit(1);
  }
  
  ensureTempDirectory();
  
  const options = parseArguments();
  
  if (options.help) {
    displayHelp();
    return;
  }

  try {
    if (options.testType) {
      if (options.testType === 'all') {
        await runAllTests();
      } else {
        await runTest(options.testType);
      }
    } else {
      await runAllTests();
    }
    
    logSuccess('🎉 Test execution completed successfully!');
    logInfo('📁 Results saved to __tests__/temp/ directory');
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    logError(`Main execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTest,
  runAllTests,
  displayHelp,
  checkNodeJS,
  checkTestFiles
};
