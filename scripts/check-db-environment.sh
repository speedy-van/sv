#!/bin/bash

# ======================================================
# Database Environment Checker
# ======================================================
# Quick script to check which database you're connected to
# ======================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║            🔍 Database Environment Check                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set!"
    echo ""
    echo "💡 Solution:"
    echo "   Add DATABASE_URL to your .env.local file"
    echo ""
    exit 1
fi

# Extract database name from URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^\/]*\).*/\1/p')

echo "📊 Current Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   NODE_ENV:         ${NODE_ENV:-not set}"
echo "   ENVIRONMENT_MODE: ${ENVIRONMENT_MODE:-not set}"
echo "   Database Name:    $DB_NAME"
echo "   Database Host:    $DB_HOST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if production database
if [[ $DATABASE_URL == *"ep-dry-glitter-aftvvy9d"* ]] || [[ $DATABASE_URL == *"neondb"* ]]; then
    echo "⚠️  WARNING: PRODUCTION DATABASE DETECTED!"
    echo ""
    
    if [[ "$NODE_ENV" == "production" ]] || [[ "$ENVIRONMENT_MODE" == "production" ]]; then
        echo "✅ Environment matches database (production)"
    else
        echo "🚨 CRITICAL: Non-production environment with production database!"
        echo ""
        echo "   This configuration is BLOCKED by the protection system."
        echo "   The app will not start to protect production data."
        echo ""
        echo "💡 Solution:"
        echo "   1. Update .env.local with development DATABASE_URL"
        echo "   2. Set ENVIRONMENT_MODE=development"
        echo "   3. See QUICK_SETUP_DATABASE_SEPARATION.md"
        echo ""
        exit 1
    fi
else
    echo "✅ Development database detected"
    
    if [[ "$NODE_ENV" == "production" ]] || [[ "$ENVIRONMENT_MODE" == "production" ]]; then
        echo "⚠️  Warning: Production environment with development database"
    else
        echo "✅ Environment matches database (development)"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ Check Complete                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

exit 0

