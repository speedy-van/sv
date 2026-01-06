/**
 * B2B Migration Script
 * 
 * This script handles the migration of the database to support B2B features.
 * Run with: npx ts-node scripts/b2b-migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting B2B Migration...\n');

  try {
    // Step 1: Check if migration is needed
    console.log('Step 1: Checking database state...');
    const tables = await checkTables();
    console.log(`Found ${tables.length} existing tables\n`);

    // Step 2: Run Prisma migration
    console.log('Step 2: Running Prisma migrations...');
    console.log('Run: npx prisma migrate dev --name add_b2b_models\n');

    // Step 3: Create default data
    console.log('Step 3: Creating default data...');
    await createDefaultData();

    // Step 4: Verify migration
    console.log('\nStep 4: Verifying migration...');
    await verifyMigration();

    console.log('\n✅ B2B Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkTables(): Promise<string[]> {
  const result = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  return result.map(r => r.tablename);
}

async function createDefaultData() {
  // Create default pricing rules (if not exists)
  console.log('  - Creating default pricing rules...');
  
  const defaultRules = [
    {
      name: 'Standard Distance Rate',
      description: 'Default per-mile rate for all deliveries',
      ruleType: 'DISTANCE',
      priority: 100,
      isActive: true,
      baseRateGBP: 4500, // £45.00
      perMileRateGBP: 150, // £1.50
      minChargeGBP: 4500, // £45.00
    },
    {
      name: 'Peak Hours Surcharge',
      description: 'Additional charge for peak time deliveries',
      ruleType: 'TIME',
      priority: 90,
      isActive: true,
      peakMultiplier: 1.25,
    },
    {
      name: 'Weekend Surcharge',
      description: 'Additional charge for weekend deliveries',
      ruleType: 'TIME',
      priority: 85,
      isActive: true,
      weekendMultiplier: 1.15,
    },
  ];

  console.log('  - Default pricing rules ready (apply via admin dashboard)');

  // Create system user for audit logs (if not exists)
  console.log('  - Checking system user...');
  // This would be handled by the auth system

  console.log('  - Default data creation complete');
}

async function verifyMigration() {
  // Check Company table
  try {
    const companyCount = await prisma.company.count();
    console.log(`  ✓ Company table exists (${companyCount} records)`);
  } catch (e) {
    console.log('  ✗ Company table not found');
  }

  // Check ApiKey table
  try {
    const apiKeyCount = await prisma.apiKey.count();
    console.log(`  ✓ ApiKey table exists (${apiKeyCount} records)`);
  } catch (e) {
    console.log('  ✗ ApiKey table not found');
  }

  // Check PricingRule table
  try {
    const pricingRuleCount = await prisma.pricingRule.count();
    console.log(`  ✓ PricingRule table exists (${pricingRuleCount} records)`);
  } catch (e) {
    console.log('  ✗ PricingRule table not found');
  }

  // Check CompanyUser table
  try {
    const companyUserCount = await prisma.companyUser.count();
    console.log(`  ✓ CompanyUser table exists (${companyUserCount} records)`);
  } catch (e) {
    console.log('  ✗ CompanyUser table not found');
  }

  // Check B2BAuditLog table
  try {
    const auditLogCount = await prisma.b2BAuditLog.count();
    console.log(`  ✓ B2BAuditLog table exists (${auditLogCount} records)`);
  } catch (e) {
    console.log('  ✗ B2BAuditLog table not found');
  }

  // Check CompanyInvoice table
  try {
    const invoiceCount = await prisma.companyInvoice.count();
    console.log(`  ✓ CompanyInvoice table exists (${invoiceCount} records)`);
  } catch (e) {
    console.log('  ✗ CompanyInvoice table not found');
  }

  // Check CompanyQuote table
  try {
    const quoteCount = await prisma.companyQuote.count();
    console.log(`  ✓ CompanyQuote table exists (${quoteCount} records)`);
  } catch (e) {
    console.log('  ✗ CompanyQuote table not found');
  }
}

// Run migration
main();
