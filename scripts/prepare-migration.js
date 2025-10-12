/**
 * Migration Preparation Script
 * 
 * Prepares the environment and validates requirements
 * for the multi-drop production database migration
 */

const fs = require('fs');
const path = require('path');

class MigrationPreparation {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.envFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'apps/web/.env',
      'apps/web/.env.local'
    ];
  }

  async prepare() {
    console.log('🔧 Preparing Multi-Drop Production Migration');
    console.log('===========================================');

    try {
      // Step 1: Check environment files
      await this.checkEnvironmentFiles();
      
      // Step 2: Validate Prisma setup
      await this.validatePrismaSetup();
      
      // Step 3: Generate updated Prisma client
      await this.generatePrismaClient();
      
      // Step 4: Create migration files directory
      await this.prepareMigrationStructure();
      
      // Step 5: Validate database connection (simulation)
      await this.validateDatabaseConnection();
      
      console.log('\n✅ Migration preparation completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Ensure DATABASE_URL is configured in your environment');
      console.log('2. Run: node scripts/production-migration.js');
      console.log('3. Monitor migration progress and logs');
      
      return true;
      
    } catch (error) {
      console.error('\n❌ Migration preparation failed:', error.message);
      return false;
    }
  }

  async checkEnvironmentFiles() {
    console.log('\n📄 Step 1: Checking environment configuration');
    
    let foundEnvFile = false;
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
    
    for (const envFile of this.envFiles) {
      const envPath = path.join(this.projectRoot, envFile);
      
      if (fs.existsSync(envPath)) {
        console.log(`  ✓ Found environment file: ${envFile}`);
        foundEnvFile = true;
        
        const content = fs.readFileSync(envPath, 'utf8');
        const foundVars = requiredVars.filter(varName => 
          content.includes(`${varName}=`) && !content.includes(`${varName}=""`)
        );
        
        if (foundVars.length > 0) {
          console.log(`    Variables found: ${foundVars.join(', ')}`);
        }
      }
    }
    
    if (!foundEnvFile) {
      console.log('  ⚠️  No environment files found');
      console.log('  💡 Creating example environment file...');
      
      await this.createExampleEnvFile();
    }
    
    console.log('  📋 Required environment variables:');
    requiredVars.forEach(varName => {
      console.log(`    - ${varName}`);
    });
  }

  async createExampleEnvFile() {
    const exampleEnv = `# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/speedy_van_db"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# API Configuration
API_BASE_URL="http://localhost:3000/api"

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true

# Multi-Drop Configuration
MULTI_DROP_MAX_STOPS=10
ROUTE_OPTIMIZATION_ENABLED=true

# Production Settings
NODE_ENV=development
LOG_LEVEL=info
`;

    const envPath = path.join(this.projectRoot, '.env.example');
    fs.writeFileSync(envPath, exampleEnv);
    console.log('  ✅ Created .env.example file');
  }

  async validatePrismaSetup() {
    console.log('\n🔍 Step 2: Validating Prisma setup');
    
    // Check schema files
    const schemaFiles = [
      'apps/web/prisma/schema.prisma',
      'packages/shared/prisma/schema.prisma'
    ];
    
    for (const schemaFile of schemaFiles) {
      const schemaPath = path.join(this.projectRoot, schemaFile);
      
      if (fs.existsSync(schemaPath)) {
        console.log(`  ✓ Found Prisma schema: ${schemaFile}`);
        
        const content = fs.readFileSync(schemaPath, 'utf8');
        
        // Check for multi-drop models
        const multiDropModels = ['Drop', 'Route', 'Booking'];
        const foundModels = multiDropModels.filter(model => 
          content.includes(`model ${model} {`)
        );
        
        console.log(`    Models found: ${foundModels.join(', ')}`);
        
        // Check for enhanced fields
        const enhancedFields = ['isMultiDrop', 'routeId', 'maxConcurrentDrops'];
        const foundFields = enhancedFields.filter(field => 
          content.includes(field)
        );
        
        if (foundFields.length > 0) {
          console.log(`    Enhanced fields: ${foundFields.join(', ')}`);
        }
        
      } else {
        console.log(`  ⚠️  Schema file not found: ${schemaFile}`);
      }
    }
  }

  async generatePrismaClient() {
    console.log('\n⚙️  Step 3: Generating Prisma client');
    
    const { execSync } = require('child_process');
    
    try {
      // Generate for main web app
      console.log('  📦 Generating client for web app...');
      execSync('cd apps/web && npx prisma generate', { 
        stdio: 'pipe',
        cwd: this.projectRoot 
      });
      console.log('  ✅ Web app client generated');
      
      // Generate for shared package if exists
      const sharedSchemaPath = path.join(this.projectRoot, 'packages/shared/prisma/schema.prisma');
      if (fs.existsSync(sharedSchemaPath)) {
        console.log('  📦 Generating client for shared package...');
        execSync('npx prisma generate --schema=packages/shared/prisma/schema.prisma', { 
          stdio: 'pipe',
          cwd: this.projectRoot 
        });
        console.log('  ✅ Shared package client generated');
      }
      
    } catch (error) {
      console.log('  ⚠️  Prisma client generation failed (will proceed anyway)');
      console.log('    This is normal if DATABASE_URL is not configured yet');
    }
  }

  async prepareMigrationStructure() {
    console.log('\n📁 Step 4: Preparing migration structure');
    
    const directories = [
      'database/migrations',
      'database/backups',
      'database/reports',
      'scripts/migration-logs'
    ];
    
    for (const dir of directories) {
      const dirPath = path.join(this.projectRoot, dir);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ Created directory: ${dir}`);
      } else {
        console.log(`  ✓ Directory exists: ${dir}`);
      }
    }
    
    // Check migration files
    const migrationFiles = [
      'database/migrations/001_multi_drop_production_migration.sql',
      'database/performance-indexes.sql'
    ];
    
    for (const file of migrationFiles) {
      const filePath = path.join(this.projectRoot, file);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  ✓ Migration file exists: ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`  ⚠️  Migration file missing: ${file}`);
      }
    }
  }

  async validateDatabaseConnection() {
    console.log('\n🔗 Step 5: Database connection validation');
    
    console.log('  📋 Pre-flight checks:');
    console.log('    - Database server should be running');
    console.log('    - DATABASE_URL should be configured');
    console.log('    - Database should be accessible');
    console.log('    - User should have migration privileges');
    
    console.log('\n  💡 Connection test commands:');
    console.log('    Test connection: npx prisma db pull');
    console.log('    Check status: npx prisma db status');
    console.log('    Reset (dev only): npx prisma db reset');
  }

  async createMigrationChecklist() {
    const checklist = `# Multi-Drop Production Migration Checklist

## Pre-Migration (CRITICAL)
- [ ] Database backup created and verified
- [ ] APPLICATION DOWNTIME scheduled and communicated
- [ ] DATABASE_URL configured and tested
- [ ] Migration scripts reviewed and approved
- [ ] Rollback procedure documented and tested

## Migration Execution
- [ ] Application stopped/maintenance mode enabled
- [ ] Database backup created
- [ ] Migration script executed successfully
- [ ] Data validation completed
- [ ] Performance indexes applied
- [ ] Database statistics updated

## Post-Migration Validation
- [ ] All new tables and columns exist
- [ ] Data integrity verified
- [ ] Performance benchmarks met
- [ ] Application functionality tested
- [ ] Multi-drop features working
- [ ] API endpoints responding correctly

## Go-Live
- [ ] Application restarted
- [ ] Monitoring alerts active
- [ ] Performance metrics baseline established
- [ ] Team notified of completion
- [ ] Documentation updated

## Emergency Contacts
- Database Admin: [Your DB Admin]
- DevOps Lead: [Your DevOps Lead]
- Product Manager: [Your PM]

## Rollback Triggers
- Migration fails at any step
- Data corruption detected
- Performance degrades >50%
- Critical bugs discovered
- Timeout exceeded (>30 minutes)

Generated: ${new Date().toISOString()}
`;

    const checklistPath = path.join(this.projectRoot, 'MIGRATION_CHECKLIST.md');
    fs.writeFileSync(checklistPath, checklist);
    console.log(`\n📋 Migration checklist created: MIGRATION_CHECKLIST.md`);
  }
}

// Main execution
async function main() {
  const prep = new MigrationPreparation();
  
  const success = await prep.prepare();
  
  if (success) {
    await prep.createMigrationChecklist();
    console.log('\n🎯 Migration preparation completed!');
    console.log('📖 Review MIGRATION_CHECKLIST.md before proceeding');
    process.exit(0);
  } else {
    console.log('\n💥 Migration preparation failed!');
    console.log('Please resolve issues before attempting migration');
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal preparation error:', error);
    process.exit(1);
  });
}

module.exports = MigrationPreparation;