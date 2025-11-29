# Production Build Script for Speedy Van Driver App
# This builds a standalone production binary (not a dev client)

Write-Host "🚀 Starting Production Build Process" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found" -ForegroundColor Red
    Write-Host "Please run this script from the mobile/driver-app directory"
    exit 1
}

# Verify expo-dev-client is NOT in dependencies
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.dependencies."expo-dev-client") {
    Write-Host "⚠️  Warning: expo-dev-client found in dependencies!" -ForegroundColor Yellow
    Write-Host "It should only be in devDependencies for production builds"
    Write-Host "Please move it to devDependencies"
    exit 1
}

# Clean install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pnpm install

# Show current version
$version = $packageJson.version
Write-Host ""
Write-Host "📱 App Version: $version" -ForegroundColor Cyan
Write-Host ""

# Ask for platform
Write-Host "Select platform to build:"
Write-Host "1) iOS"
Write-Host "2) Android"
Write-Host "3) Both"
$platformChoice = Read-Host "Enter choice (1-3)"

switch ($platformChoice) {
    "1" { $platform = "ios" }
    "2" { $platform = "android" }
    "3" { $platform = "all" }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

# Confirm build
Write-Host ""
Write-Host "⚙️  Build Configuration:" -ForegroundColor Yellow
Write-Host "   Platform: $platform"
Write-Host "   Profile: production"
Write-Host "   Type: Standalone (NO dev client)"
Write-Host ""
$confirm = Read-Host "Continue? (y/n)"

if ($confirm -ne "y") {
    Write-Host "Build cancelled"
    exit 0
}

# Start build
Write-Host ""
Write-Host "🏗️  Starting EAS Build..." -ForegroundColor Green
Write-Host "This will:"
Write-Host "  ✓ Build a standalone production binary"
Write-Host "  ✓ No Metro/dev server dependency"
Write-Host "  ✓ All native modules properly registered"
Write-Host "  ✓ Ready for distribution"
Write-Host ""

npx eas build --platform $platform --profile production

Write-Host ""
Write-Host "✅ Build submitted to EAS!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Wait for build to complete on EAS dashboard"
Write-Host "2. Download the build artifact (.ipa or .apk)"
Write-Host "3. Install on a physical device"
Write-Host "4. Verify app launches without Metro screen"
Write-Host "5. Test all core functionality"
Write-Host "6. Only then send to client"
Write-Host ""
Write-Host "Monitor build: https://expo.dev/accounts/speedy-van/projects/speedy-van-driver/builds" -ForegroundColor Cyan
