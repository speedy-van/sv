#!/usr/bin/env tsx
/**
 * Environment Verification Script
 * 
 * Run this script to verify your environment is correctly configured
 * and that database protection is working.
 */

import { getEnvironmentInfo, validateDatabaseEnvironment } from '../packages/shared/src/database/db-protection';

console.log(`
╔════════════════════════════════════════════════════════════════╗
║            🔍 Environment Verification Tool                    ║
╚════════════════════════════════════════════════════════════════╝
`);

try {
  // Run validation
  validateDatabaseEnvironment();
  
  // Get detailed info
  const info = getEnvironmentInfo();
  
  console.log('✅ Environment validation passed!\n');
  console.log('📊 Environment Details:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   NODE_ENV:              ${info.nodeEnv || 'not set'}`);
  console.log(`   ENVIRONMENT_MODE:      ${info.environmentMode || 'not set'}`);
  console.log(`   Is Production:         ${info.isProduction ? '✅ YES' : '❌ NO'}`);
  console.log(`   Database Type:         ${info.isDatabaseProduction ? '⚠️  PRODUCTION' : '✅ DEVELOPMENT'}`);
  console.log(`   Migrations Allowed:    ${info.migrationsAllowed ? '✅ YES' : '❌ NO'}`);
  console.log(`   Seeding Allowed:       ${info.seedingAllowed ? '✅ YES' : '❌ NO'}`);
  console.log(`   Database URL Preview:  ${info.databaseUrl}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Environment-specific recommendations
  if (info.isProduction) {
    console.log('⚠️  PRODUCTION ENVIRONMENT ACTIVE\n');
    console.log('   Recommendations:');
    console.log('   • Exercise extreme caution with database operations');
    console.log('   • All operations are logged for audit purposes');
    console.log('   • Test migrations in development/staging first');
    console.log('   • Never run data seeding scripts\n');
  } else {
    console.log('✅ DEVELOPMENT ENVIRONMENT ACTIVE\n');
    console.log('   You can safely:');
    console.log('   • Run migrations: npx prisma migrate dev');
    console.log('   • Seed test data: npx prisma db seed');
    console.log('   • Reset database: npx prisma migrate reset');
    console.log('   • Experiment with schema changes\n');
  }
  
  // Validate configuration
  const issues: string[] = [];
  
  if (info.isProduction && !info.isDatabaseProduction) {
    issues.push('⚠️  Production environment but using development database');
  }
  
  if (!info.isProduction && info.isDatabaseProduction) {
    issues.push('🚨 CRITICAL: Development environment trying to use production database!');
  }
  
  if (!info.nodeEnv) {
    issues.push('⚠️  NODE_ENV is not set');
  }
  
  if (!info.environmentMode) {
    issues.push('⚠️  ENVIRONMENT_MODE is not set');
  }
  
  if (issues.length > 0) {
    console.log('⚠️  Configuration Issues Found:\n');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('');
  } else {
    console.log('✅ No configuration issues found!\n');
  }
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                  ✅ Verification Complete                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  process.exit(0);
  
} catch (error: any) {
  console.error('\n❌ Environment validation failed!\n');
  console.error('Error:', error.message);
  console.error('\n💡 Solution:');
  console.error('   1. Check your .env.local file');
  console.error('   2. Ensure DATABASE_URL points to development database');
  console.error('   3. Set ENVIRONMENT_MODE=development');
  console.error('   4. See QUICK_SETUP_DATABASE_SEPARATION.md for help\n');
  
  process.exit(1);
}

