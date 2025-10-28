# Speedy Van Driver - Android Build Script v2.0.0 (PowerShell)
# This script builds the Android app for production on Windows

Write-Host "🚀 ======================================" -ForegroundColor Blue
Write-Host "🚀 Speedy Van Driver v2.0.0 Android Build" -ForegroundColor Blue
Write-Host "🚀 ======================================" -ForegroundColor Blue
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "app.json")) {
    Write-Host "❌ Error: app.json not found. Please run this script from mobile/driver-app directory" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Build Configuration:" -ForegroundColor Cyan
Write-Host "  • App Name: Speedy Van Driver"
Write-Host "  • Version: 2.0.0"
Write-Host "  • Version Code: 2"
Write-Host "  • Platform: Android"
Write-Host "  • Build Type: Production (AAB)"
Write-Host "  • Package: com.speedyvan.driver"
Write-Host ""

# Check if EAS CLI is installed
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "❌ EAS CLI not found" -ForegroundColor Red
    Write-Host "📦 Installing EAS CLI..." -ForegroundColor Cyan
    npm install -g eas-cli
    Write-Host "✅ EAS CLI installed" -ForegroundColor Green
    Write-Host ""
}

# Check EAS login status
Write-Host "🔐 Checking EAS login status..." -ForegroundColor Cyan
$easUser = eas whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to EAS" -ForegroundColor Red
    Write-Host "🔑 Please login to EAS:" -ForegroundColor Cyan
    eas login
} else {
    Write-Host "✅ Logged in as: $easUser" -ForegroundColor Green
}
Write-Host ""

# Prompt for build type
Write-Host "📦 Select build type:" -ForegroundColor Cyan
Write-Host "  1) Production (AAB for Google Play) - Recommended"
Write-Host "  2) Preview (APK for direct install)"
Write-Host "  3) Development (Debug build)"
$buildChoice = Read-Host "Enter choice (1-3)"
Write-Host ""

switch ($buildChoice) {
    "1" {
        $profile = "production"
        $buildType = "AAB"
        Write-Host "✅ Building production AAB" -ForegroundColor Green
    }
    "2" {
        $profile = "preview"
        $buildType = "APK"
        Write-Host "✅ Building preview APK" -ForegroundColor Green
    }
    "3" {
        $profile = "development"
        $buildType = "APK"
        Write-Host "✅ Building development APK" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid choice. Defaulting to production." -ForegroundColor Yellow
        $profile = "production"
        $buildType = "AAB"
    }
}

Write-Host ""
Write-Host "🏗️  Starting build..." -ForegroundColor Cyan
Write-Host "⏱️  This may take 10-20 minutes..." -ForegroundColor Cyan
Write-Host ""

# Run EAS build
eas build --platform android --profile $profile --non-interactive

# Check build result
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 ======================================" -ForegroundColor Green
    Write-Host "🎉 Build Completed Successfully!" -ForegroundColor Green
    Write-Host "🎉 ======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📥 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Download the $buildType file from Expo dashboard"
    Write-Host "  2. Visit: https://expo.dev"
    Write-Host "  3. Go to: Projects → speedy-van-driver → Builds"
    Write-Host "  4. Download the latest Android build"
    Write-Host "  5. For production: Upload to Google Play Console (Internal Testing)"
    Write-Host "  6. For preview: Install directly on test devices"
    Write-Host ""
    Write-Host "✅ Version 2.0.0 is ready for deployment!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ ======================================" -ForegroundColor Red
    Write-Host "❌ Build Failed!" -ForegroundColor Red
    Write-Host "❌ ======================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  • Check logs above for specific errors"
    Write-Host "  • Ensure all dependencies are installed: pnpm install"
    Write-Host "  • Try: eas build:list --platform android"
    Write-Host "  • Contact support: https://expo.dev/support"
    Write-Host ""
}

Write-Host ""
Write-Host "📚 For more information, see BUILD_INSTRUCTIONS.md" -ForegroundColor Cyan

