#!/usr/bin/env tsx

/**
 * Verify Database Isolation
 * 
 * This script verifies that the development environment is NOT connected
 * to the production database. It's a safety check to prevent accidental
 * data corruption in production.
 */

import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function header(message: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(message, colors.cyan + colors.bright);
  log('='.repeat(60), colors.cyan);
}

// Production database identifiers
const PRODUCTION_INDICATORS = [
  'ep-dry-glitter-aftvvy9d-pooler',
  'c-2.us-west-2.aws.neon.tech',
  'npg_qNFE0IHpk1vT', // production password fragment
];

// Safe development indicators
const SAFE_INDICATORS = [
  'localhost',
  '127.0.0.1',
  'speedy_van_dev',
  'dev_database',
];

interface CheckResult {
  passed: boolean;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

function checkEnvFile(filePath: string): CheckResult {
  if (!fs.existsSync(filePath)) {
    return {
      passed: true,
      message: `${filePath} does not exist (OK)`,
      severity: 'info',
    };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const databaseUrlMatch = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);

  if (!databaseUrlMatch) {
    return {
      passed: false,
      message: `${filePath} does not contain DATABASE_URL`,
      severity: 'warning',
    };
  }

  const databaseUrl = databaseUrlMatch[1];

  // Check for production indicators
  for (const indicator of PRODUCTION_INDICATORS) {
    if (databaseUrl.includes(indicator)) {
      return {
        passed: false,
        message: `🚨 CRITICAL: ${filePath} contains PRODUCTION database URL!`,
        severity: 'critical',
      };
    }
  }

  // Check for safe indicators
  const hasSafeIndicator = SAFE_INDICATORS.some((indicator) =>
    databaseUrl.includes(indicator)
  );

  if (!hasSafeIndicator) {
    return {
      passed: false,
      message: `⚠️  ${filePath} database URL doesn't contain safe indicators (localhost, dev_database)`,
      severity: 'warning',
    };
  }

  return {
    passed: true,
    message: `✓ ${filePath} is configured for local development`,
    severity: 'info',
  };
}

function checkEnvironmentVariable(): CheckResult {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      passed: false,
      message: 'DATABASE_URL environment variable is not set',
      severity: 'warning',
    };
  }

  // Check for production indicators
  for (const indicator of PRODUCTION_INDICATORS) {
    if (databaseUrl.includes(indicator)) {
      return {
        passed: false,
        message: '🚨 CRITICAL: DATABASE_URL environment variable contains PRODUCTION URL!',
        severity: 'critical',
      };
    }
  }

  // Check for safe indicators
  const hasSafeIndicator = SAFE_INDICATORS.some((indicator) =>
    databaseUrl.includes(indicator)
  );

  if (!hasSafeIndicator) {
    return {
      passed: false,
      message: '⚠️  DATABASE_URL doesn\'t contain safe indicators',
      severity: 'warning',
    };
  }

  return {
    passed: true,
    message: '✓ DATABASE_URL environment variable is safe',
    severity: 'info',
  };
}

function checkNodeEnv(): CheckResult {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv === 'production') {
    return {
      passed: false,
      message: '⚠️  NODE_ENV is set to "production" but you\'re running locally',
      severity: 'warning',
    };
  }

  if (nodeEnv === 'development') {
    return {
      passed: true,
      message: '✓ NODE_ENV is correctly set to "development"',
      severity: 'info',
    };
  }

  return {
    passed: true,
    message: `NODE_ENV is "${nodeEnv || 'not set'}"`,
    severity: 'info',
  };
}

async function main() {
  header('🔒 Database Isolation Verification');

  const checks: CheckResult[] = [];

  // Check .env files
  const envFiles = [
    '.env.local',
    '.env.development.local',
    '.env',
    'apps/web/.env.local',
    'packages/shared/.env.local',
  ];

  log('\n📄 Checking environment files...\n');
  for (const envFile of envFiles) {
    const result = checkEnvFile(path.join(process.cwd(), envFile));
    checks.push(result);

    if (result.severity === 'critical') {
      error(result.message);
    } else if (result.severity === 'warning') {
      warning(result.message);
    } else {
      success(result.message);
    }
  }

  // Check environment variable
  log('\n🌍 Checking environment variables...\n');
  const envVarCheck = checkEnvironmentVariable();
  checks.push(envVarCheck);

  if (envVarCheck.severity === 'critical') {
    error(envVarCheck.message);
  } else if (envVarCheck.severity === 'warning') {
    warning(envVarCheck.message);
  } else {
    success(envVarCheck.message);
  }

  // Check NODE_ENV
  const nodeEnvCheck = checkNodeEnv();
  checks.push(nodeEnvCheck);

  if (nodeEnvCheck.severity === 'critical') {
    error(nodeEnvCheck.message);
  } else if (nodeEnvCheck.severity === 'warning') {
    warning(nodeEnvCheck.message);
  } else {
    success(nodeEnvCheck.message);
  }

  // Summary
  header('📊 Verification Summary');

  const criticalIssues = checks.filter((c) => c.severity === 'critical' && !c.passed);
  const warnings = checks.filter((c) => c.severity === 'warning' && !c.passed);
  const passed = checks.filter((c) => c.passed);

  log(`\nTotal checks: ${checks.length}`);
  log(`✅ Passed: ${passed.length}`, colors.green);
  log(`⚠️  Warnings: ${warnings.length}`, colors.yellow);
  log(`❌ Critical issues: ${criticalIssues.length}`, colors.red);

  if (criticalIssues.length > 0) {
    header('🚨 CRITICAL SECURITY ALERT 🚨');
    error('\nYour development environment is configured to use PRODUCTION database!');
    error('This is EXTREMELY DANGEROUS and must be fixed immediately!\n');
    error('Actions required:');
    error('1. STOP all development servers immediately');
    error('2. Update .env.local with local database URL:');
    error('   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/speedy_van_dev"');
    error('3. Re-run this verification script');
    error('4. Only then restart your development server\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    warning('\n⚠️  Some warnings were detected. Please review them above.');
  }

  if (criticalIssues.length === 0 && warnings.length === 0) {
    header('🎉 All Checks Passed!');
    success('\nYour development environment is properly isolated from production.');
    success('You can safely run: pnpm dev\n');
  }

  process.exit(warnings.length > 0 ? 1 : 0);
}

main().catch((err) => {
  error(`Fatal error: ${err}`);
  process.exit(1);
});

