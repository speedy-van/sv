# iOS Build Setup Script for Speedy Van Driver App (PowerShell)
# This script will guide you through the EAS build setup process

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Speedy Van Driver - iOS Build Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli
    Write-Host "✅ EAS CLI installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ EAS CLI is already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 1: Login to Expo" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

eas login

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 2: Configure EAS Build" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

eas build:configure

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 3: Set up Apple Credentials" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run the following command to set up your Apple credentials:" -ForegroundColor Yellow
Write-Host "  eas credentials" -ForegroundColor White
Write-Host ""
Write-Host "Then select:" -ForegroundColor Yellow
Write-Host "  1. iOS" -ForegroundColor White
Write-Host "  2. Production" -ForegroundColor White
Write-Host "  3. Set up credentials from scratch (or use existing)" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to open credentials setup..."

eas credentials

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. Build iOS app: eas build --platform ios --profile production" -ForegroundColor White
Write-Host "  2. Monitor build: https://expo.dev" -ForegroundColor White
Write-Host "  3. Submit to TestFlight: eas submit --platform ios --latest" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: IOS_BUILD_SETUP_GUIDE.md" -ForegroundColor Yellow
Write-Host ""






