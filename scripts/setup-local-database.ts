#!/usr/bin/env tsx

/**
 * Setup Local Development Database
 * 
 * This script helps you set up a local PostgreSQL database for development.
 * It ensures you're NEVER using the production database in development.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function header(message: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(message, colors.cyan + colors.bright);
  log('='.repeat(60), colors.cyan);
}

function checkPostgreSQL(): boolean {
  try {
    execSync('psql --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkDatabaseExists(dbName: string): boolean {
  try {
    execSync(`psql -U postgres -lqt | cut -d \\| -f 1 | grep -qw ${dbName}`, {
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function createDatabase(dbName: string): boolean {
  try {
    info(`Creating database: ${dbName}`);
    execSync(`psql -U postgres -c "CREATE DATABASE ${dbName};"`, {
      stdio: 'inherit',
    });
    success(`Database ${dbName} created successfully!`);
    return true;
  } catch (err) {
    error(`Failed to create database: ${err}`);
    return false;
  }
}

function checkEnvFile(): { exists: boolean; isProduction: boolean } {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    return { exists: false, isProduction: false };
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const isProduction = envContent.includes('ep-dry-glitter-aftvvy9d-pooler');
  
  return { exists: true, isProduction };
}

function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const examplePath = path.join(process.cwd(), 'env.example');
  
  if (!fs.existsSync(examplePath)) {
    error('env.example file not found!');
    return false;
  }

  info('Creating .env.local from env.example...');
  
  let content = fs.readFileSync(examplePath, 'utf-8');
  
  // Update DATABASE_URL to local
  content = content.replace(
    /DATABASE_URL=.*/,
    'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/speedy_van_dev"'
  );
  
  // Set NODE_ENV to development
  content = content.replace(
    /NODE_ENV=.*/,
    'NODE_ENV=development'
  );
  
  // Disable SMS in development
  content = content.replace(
    /DISABLE_SMS=.*/,
    'DISABLE_SMS=true'
  );

  fs.writeFileSync(envPath, content);
  success('.env.local created with local database configuration!');
  return true;
}

async function applyMigrations(): Promise<boolean> {
  try {
    info('Applying Prisma migrations...');
    execSync(
      'pnpm prisma migrate deploy --schema=./packages/shared/prisma/schema.prisma',
      { stdio: 'inherit' }
    );
    success('Migrations applied successfully!');
    return true;
  } catch (err) {
    error(`Failed to apply migrations: ${err}`);
    return false;
  }
}

async function generatePrismaClient(): Promise<boolean> {
  try {
    info('Generating Prisma Client...');
    execSync(
      'pnpm prisma generate --schema=./packages/shared/prisma/schema.prisma',
      { stdio: 'inherit' }
    );
    success('Prisma Client generated successfully!');
    return true;
  } catch (err) {
    error(`Failed to generate Prisma Client: ${err}`);
    return false;
  }
}

function verifySetup() {
  header('🔍 Verifying Setup');
  
  const envCheck = checkEnvFile();
  
  if (!envCheck.exists) {
    error('.env.local file not found!');
    return false;
  }
  
  if (envCheck.isProduction) {
    error('⚠️  CRITICAL: .env.local contains PRODUCTION database URL!');
    error('This is extremely dangerous and must be fixed immediately.');
    return false;
  }
  
  success('.env.local is configured for local development ✓');
  return true;
}

async function main() {
  header('🚀 Speedy Van - Local Development Database Setup');
  
  // Step 1: Check PostgreSQL installation
  info('Step 1: Checking PostgreSQL installation...');
  if (!checkPostgreSQL()) {
    error('PostgreSQL is not installed or not in PATH!');
    info('\nPlease install PostgreSQL:');
    info('  Windows: choco install postgresql');
    info('  macOS:   brew install postgresql@15');
    info('  Linux:   sudo apt install postgresql');
    process.exit(1);
  }
  success('PostgreSQL is installed ✓');

  // Step 2: Check .env.local
  info('\nStep 2: Checking .env.local configuration...');
  const envCheck = checkEnvFile();
  
  if (envCheck.isProduction) {
    warning('⚠️  CRITICAL WARNING ⚠️');
    warning('Your .env.local file contains a PRODUCTION database URL!');
    warning('This script will NOT proceed to protect your production data.');
    info('\nPlease manually update .env.local with:');
    info('DATABASE_URL="postgresql://postgres:postgres@localhost:5432/speedy_van_dev"');
    process.exit(1);
  }

  if (!envCheck.exists) {
    info('Creating .env.local for local development...');
    createEnvFile();
  } else {
    success('.env.local exists and is configured for local development ✓');
  }

  // Step 3: Create local database
  info('\nStep 3: Setting up local database...');
  const dbName = 'speedy_van_dev';
  
  if (checkDatabaseExists(dbName)) {
    success(`Database ${dbName} already exists ✓`);
  } else {
    if (!createDatabase(dbName)) {
      error('Failed to create database. Please create it manually:');
      info('  psql -U postgres -c "CREATE DATABASE speedy_van_dev;"');
      process.exit(1);
    }
  }

  // Step 4: Apply migrations
  info('\nStep 4: Applying database migrations...');
  if (!(await applyMigrations())) {
    error('Failed to apply migrations!');
    process.exit(1);
  }

  // Step 5: Generate Prisma Client
  info('\nStep 5: Generating Prisma Client...');
  if (!(await generatePrismaClient())) {
    error('Failed to generate Prisma Client!');
    process.exit(1);
  }

  // Step 6: Verify setup
  if (!verifySetup()) {
    error('Setup verification failed!');
    process.exit(1);
  }

  // Success!
  header('🎉 Setup Complete!');
  success('Your local development database is ready to use!');
  info('\nNext steps:');
  info('  1. Run: pnpm dev');
  info('  2. Open: http://localhost:3000');
  info('  3. Start developing safely!');
  info('\n📚 For more information, see: DATABASE_SETUP_GUIDE.md');
}

main().catch((err) => {
  error(`Fatal error: ${err}`);
  process.exit(1);
});

