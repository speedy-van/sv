/**
 * Database Protection System
 * 
 * This module provides critical protection for the production database
 * by preventing unauthorized access and destructive operations during development.
 */

import { PrismaClient } from '@prisma/client';

// Production database identifiers
const PRODUCTION_DB_IDENTIFIERS = [
  'ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech',
  'neondb',
  'npg_qNFE0IHpk1vT'
];

// Allowed environments for production database
const ALLOWED_PRODUCTION_ENVS = ['production', 'prod'];

/**
 * Check if the current DATABASE_URL points to production
 */
export function isProductionDatabase(databaseUrl?: string): boolean {
  const url = databaseUrl || process.env.DATABASE_URL || '';
  
  return PRODUCTION_DB_IDENTIFIERS.some(identifier => 
    url.includes(identifier)
  );
}

/**
 * Check if the current environment is production
 */
export function isProductionEnvironment(): boolean {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const envMode = (process.env.ENVIRONMENT_MODE || '').toLowerCase();
  
  return ALLOWED_PRODUCTION_ENVS.includes(nodeEnv) || 
         ALLOWED_PRODUCTION_ENVS.includes(envMode);
}

/**
 * Validates that development environment is not using production database
 * Throws error if misconfigured
 */
export function validateDatabaseEnvironment(): void {
  const isProdDb = isProductionDatabase();
  const isProdEnv = isProductionEnvironment();
  
  // If we're using production database in non-production environment, BLOCK
  if (isProdDb && !isProdEnv) {
    const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║                   🚨 DATABASE PROTECTION 🚨                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  CRITICAL ERROR: Production database detected in              ║
║  non-production environment!                                  ║
║                                                                ║
║  Current Environment: ${process.env.NODE_ENV || 'development'}                             ║
║  Database: PRODUCTION                                         ║
║                                                                ║
║  This is a safety mechanism to prevent accidental data        ║
║  modification or deletion in the production database.         ║
║                                                                ║
║  SOLUTION:                                                    ║
║  1. Update your .env.local with development database URL      ║
║  2. Set ENVIRONMENT_MODE=development                          ║
║  3. Never use production DATABASE_URL in development          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `;
    
    console.error(errorMessage);
    throw new Error('PRODUCTION_DATABASE_ACCESS_BLOCKED');
  }
  
  // Log current environment for transparency
  console.log(`
🔒 Database Environment Check:
   Environment: ${isProdEnv ? 'PRODUCTION' : 'DEVELOPMENT'}
   Database: ${isProdDb ? 'PRODUCTION' : 'DEVELOPMENT'}
   Status: ${isProdDb === isProdEnv ? '✅ VALID' : '⚠️ MISMATCH'}
  `);
}

/**
 * Check if migrations are allowed in current environment
 */
export function areMigrationsAllowed(): boolean {
  const allowMigrations = process.env.ALLOW_MIGRATIONS === 'true';
  const isProdEnv = isProductionEnvironment();
  
  if (isProdEnv) {
    // In production, migrations must be explicitly allowed via environment variable
    return allowMigrations;
  }
  
  // In development, always allow migrations
  return true;
}

/**
 * Check if data seeding is allowed in current environment
 */
export function isSeedingAllowed(): boolean {
  const allowSeeding = process.env.ALLOW_DATA_SEEDING === 'true';
  const isProdEnv = isProductionEnvironment();
  
  // Never allow seeding in production
  if (isProdEnv) {
    return false;
  }
  
  // In development, allow seeding if explicitly enabled
  return allowSeeding;
}

/**
 * Creates a protected Prisma client with environment validation
 */
export function createProtectedPrismaClient(): PrismaClient {
  // Validate environment before creating client
  validateDatabaseEnvironment();
  
  const client = new PrismaClient({
    log: isProductionEnvironment() 
      ? ['error', 'warn'] 
      : ['query', 'error', 'warn', 'info'],
    errorFormat: 'pretty',
  });
  
  // Add warning for production database operations
  if (isProductionDatabase() && isProductionEnvironment()) {
    console.warn(`
⚠️  PRODUCTION DATABASE ACTIVE
   All operations will affect live customer data.
   Exercise extreme caution.
    `);
  }
  
  return client;
}

/**
 * Middleware to block destructive operations in production
 */
export function createProductionProtectionMiddleware() {
  return async (params: any, next: any) => {
    const isProdDb = isProductionDatabase();
    const isProdEnv = isProductionEnvironment();
    
    // Destructive operations to monitor
    const destructiveOperations = [
      'delete',
      'deleteMany',
      'createMany',
      'updateMany'
    ];
    
    // If in production, log all destructive operations
    if (isProdDb && isProdEnv && destructiveOperations.includes(params.action)) {
      console.warn(`
⚠️  PRODUCTION DATABASE OPERATION
   Model: ${params.model}
   Action: ${params.action}
   Time: ${new Date().toISOString()}
      `);
    }
    
    return next(params);
  };
}

/**
 * Get current environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    environmentMode: process.env.ENVIRONMENT_MODE,
    isProduction: isProductionEnvironment(),
    isDatabaseProduction: isProductionDatabase(),
    migrationsAllowed: areMigrationsAllowed(),
    seedingAllowed: isSeedingAllowed(),
    databaseUrl: process.env.DATABASE_URL 
      ? `${process.env.DATABASE_URL.substring(0, 30)}...` 
      : 'NOT SET',
  };
}

// Export all protection utilities
export default {
  isProductionDatabase,
  isProductionEnvironment,
  validateDatabaseEnvironment,
  areMigrationsAllowed,
  isSeedingAllowed,
  createProtectedPrismaClient,
  createProductionProtectionMiddleware,
  getEnvironmentInfo,
};

