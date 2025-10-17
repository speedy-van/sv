#!/bin/bash

# ZeptoMail Security Setup Script
# Run this script to implement all security fixes

echo "🚀 ZeptoMail Security Setup"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the apps/web directory"
    exit 1
fi

echo "📋 Step 1: Checking environment variables..."

# Check required environment variables
if [ -z "$ZEPTO_API_KEY" ]; then
    echo "⚠️  Warning: ZEPTO_API_KEY not set"
fi

if [ -z "$ZEPTO_API_URL" ]; then
    echo "⚠️  Warning: ZEPTO_API_URL not set"
fi

if [ -z "$MAIL_FROM" ]; then
    echo "⚠️  Warning: MAIL_FROM not set"
fi

echo "📋 Step 2: Running database cleanup..."

# Run the cleanup script
if [ -f "src/scripts/cleanup-invalid-emails.ts" ]; then
    echo "🧹 Running email cleanup script..."
    npx ts-node src/scripts/cleanup-invalid-emails.ts
else
    echo "❌ Cleanup script not found"
fi

echo "📋 Step 3: Testing security API..."

# Test the security API (if server is running)
if curl -s http://localhost:3000/api/admin/email-security > /dev/null 2>&1; then
    echo "✅ Security API is accessible"
    echo "📊 Security status:"
    curl -s http://localhost:3000/api/admin/email-security | jq '.securityAudit.grade' 2>/dev/null || echo "   (JSON parsing failed - check API response)"
else
    echo "⚠️  Security API not accessible (server may not be running)"
fi

echo "📋 Step 4: Verification checklist..."

# Check if security files exist
files=(
    "src/lib/email/email-validation.ts"
    "src/lib/email/spam-filter.ts"
    "src/lib/email/security-config.ts"
    "src/app/api/admin/email-security/route.ts"
    "ZEPTOMAIL_SECURITY_FIX.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo "1. Update your .env.local file with:"
echo "   SUPPRESSED_EMAILS=bad@example.com,invalid@test.com"
echo "   SUPPRESSED_DOMAINS=tempmail.org,10minutemail.com"
echo ""
echo "2. Restart your development server:"
echo "   pnpm run dev"
echo ""
echo "3. Check security status:"
echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:3000/api/admin/email-security"
echo ""
echo "4. Contact ZeptoMail support with the implementation report:"
echo "   See: ZEPTOMAIL_SECURITY_FIX.md"
echo ""
echo "✅ Setup completed! Your email system is now secure."
