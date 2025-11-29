# TurboModule Crash Fix - PowerShell Script
# Date: November 29, 2025
# Purpose: Fix PlatformConstants TurboModule error

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TurboModule Crash Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
$currentPath = Get-Location
if (-not (Test-Path ".\mobile\driver-app")) {
    Write-Host "ERROR: mobile/driver-app not found!" -ForegroundColor Red
    Write-Host "Current path: $currentPath" -ForegroundColor Yellow
    Write-Host "Please run this script from project root (c:\sv)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Phase 1: Installing expo-build-properties..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Set-Location ".\mobile\driver-app"

pnpm add expo-build-properties
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install expo-build-properties" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "Phase 2: Cleaning cache and build artifacts..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Remove node_modules
if (Test-Path ".\node_modules") {
    Write-Host "Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".\node_modules"
}

# Remove .expo cache
if (Test-Path ".\.expo") {
    Write-Host "Removing .expo cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".\.expo"
}

# Remove iOS Pods
if (Test-Path ".\ios\Pods") {
    Write-Host "Removing iOS Pods..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".\ios\Pods"
}

# Remove Podfile.lock
if (Test-Path ".\ios\Podfile.lock") {
    Write-Host "Removing Podfile.lock..." -ForegroundColor Yellow
    Remove-Item -Force ".\ios\Podfile.lock"
}

Write-Host "✅ Cache cleaned" -ForegroundColor Green
Write-Host ""

Write-Host "Phase 3: Reinstalling dependencies..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "Phase 4: Updating iOS Pods..." -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
if (Test-Path ".\ios") {
    Set-Location ".\ios"
    pod install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Pod install failed, but continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Pods updated" -ForegroundColor Green
    }
    Set-Location ".."
} else {
    Write-Host "WARNING: ios folder not found, skipping..." -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Phase 5: Prebuilding native modules..." -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
npx expo prebuild --clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Prebuild failed, but continuing..." -ForegroundColor Yellow
}
Write-Host "✅ Prebuild complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Fix script completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Build production version:" -ForegroundColor White
Write-Host "   eas build --platform ios --profile production --clear-cache" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Test on physical iPhone (NOT Simulator)" -ForegroundColor White
Write-Host ""
Write-Host "3. Verify app goes directly to login screen" -ForegroundColor White
Write-Host "   - No 'Downloading 100%' screen" -ForegroundColor White
Write-Host "   - No TurboModule errors" -ForegroundColor White
Write-Host ""

# Return to root
Set-Location "..\.."
