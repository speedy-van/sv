# Production Deployment Script for Speedy Van
# This script helps deploy to production database

Write-Host "🚀 Speedy Van Production Deployment Script" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if DATABASE_URL is set
Write-Host "📋 Step 1: Checking Environment Variables..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

if ($env:DATABASE_URL) {
    Write-Host "✅ DATABASE_URL is set" -ForegroundColor Green
    if ($env:DATABASE_URL -like "*ep-dry-glitter*") {
        Write-Host "✅ Production database detected" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: Not using production database!" -ForegroundColor Red
        Write-Host "   Current DATABASE_URL: $($env:DATABASE_URL.Substring(0, [Math]::Min(50, $env:DATABASE_URL.Length)))..." -ForegroundColor Yellow
        $confirm = Read-Host "Continue anyway? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Host "❌ Deployment cancelled" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "❌ DATABASE_URL is not set!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Verify Prisma Schema
Write-Host "📋 Step 2: Verifying Prisma Schema..." -ForegroundColor Yellow
Set-Location packages\shared

try {
    $validateOutput = npx prisma validate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Schema is valid" -ForegroundColor Green
    } else {
        Write-Host "❌ Schema validation failed:" -ForegroundColor Red
        Write-Host $validateOutput
        exit 1
    }
} catch {
    Write-Host "❌ Error validating schema: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Check Migration Status
Write-Host "📋 Step 3: Checking Migration Status..." -ForegroundColor Yellow

try {
    $statusOutput = npx prisma migrate status 2>&1
    Write-Host $statusOutput
    
    if ($statusOutput -like "*Database is up to date*") {
        Write-Host "✅ All migrations are applied" -ForegroundColor Green
    } elseif ($statusOutput -like "*pending*") {
        Write-Host "⚠️  Pending migrations found" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "⚠️  WARNING: You are about to apply migrations to PRODUCTION database!" -ForegroundColor Red
        Write-Host "   Make sure you have:" -ForegroundColor Yellow
        Write-Host "   1. Created a backup of production database" -ForegroundColor Yellow
        Write-Host "   2. Reviewed all migration files" -ForegroundColor Yellow
        Write-Host "   3. Tested migrations in development" -ForegroundColor Yellow
        Write-Host ""
        $confirm = Read-Host "Continue with migration deployment? (yes/no)"
        
        if ($confirm -ne "yes") {
            Write-Host "❌ Migration deployment cancelled" -ForegroundColor Red
            exit 1
        }
        
        # Step 4: Apply Migrations
        Write-Host ""
        Write-Host "📋 Step 4: Applying Migrations to Production..." -ForegroundColor Yellow
        Write-Host "⚠️  This will modify the PRODUCTION database!" -ForegroundColor Red
        
        try {
            $migrateOutput = npx prisma migrate deploy 2>&1
            Write-Host $migrateOutput
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Migrations applied successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ Migration deployment failed!" -ForegroundColor Red
                Write-Host "   Review the error messages above" -ForegroundColor Yellow
                exit 1
            }
        } catch {
            Write-Host "❌ Error applying migrations: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  Unexpected migration status" -ForegroundColor Yellow
        Write-Host "   Review the output above" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error checking migration status: $_" -ForegroundColor Red
    Write-Host "   Make sure DATABASE_URL is set correctly" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 5: Verify Database Connection
Write-Host "📋 Step 5: Verifying Database Connection..." -ForegroundColor Yellow

try {
    $testOutput = npx prisma db execute --stdin 2>&1 <<< "SELECT current_database(), current_user;"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
        Write-Host $testOutput
    } else {
        Write-Host "⚠️  Database connection test failed" -ForegroundColor Yellow
        Write-Host "   This might be normal if the command format is different" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not test database connection (this might be normal)" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Generate Prisma Client
Write-Host "📋 Step 6: Generating Prisma Client..." -ForegroundColor Yellow
Set-Location ..\..

try {
    $generateOutput = pnpm --filter @speedy-van/app run prisma:generate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Prisma client generation failed:" -ForegroundColor Red
        Write-Host $generateOutput
        exit 1
    }
} catch {
    Write-Host "❌ Error generating Prisma client: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 7: Build Application
Write-Host "📋 Step 7: Building Application..." -ForegroundColor Yellow

try {
    $buildOutput = pnpm --filter @speedy-van/app build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed:" -ForegroundColor Red
        Write-Host $buildOutput
        exit 1
    }
} catch {
    Write-Host "❌ Error building application: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "✅ Production Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review the build output above" -ForegroundColor White
Write-Host "2. Test the application locally: pnpm --filter @speedy-van/app start" -ForegroundColor White
Write-Host "3. Verify /api/admin/me endpoint works" -ForegroundColor White
Write-Host "4. Deploy to production server" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Remember: You are now connected to PRODUCTION database!" -ForegroundColor Red
Write-Host ""

