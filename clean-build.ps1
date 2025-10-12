# 🧹 Clean Build Script - Dataset Validation Fix v3
# Run this to completely clean and rebuild the project

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧹 Clean Build - Dataset Validation Fix v3" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running processes
Write-Host "⏹️  Step 1: Stopping any running dev servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✅ Done" -ForegroundColor Green
Write-Host ""

# Step 2: Remove .next directory
Write-Host "🗑️  Step 2: Removing .next directory..." -ForegroundColor Yellow
if (Test-Path "apps/web/.next") {
    Remove-Item -Path "apps/web/.next" -Recurse -Force
    Write-Host "✅ .next directory removed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next directory not found (already clean)" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Remove node_modules/.cache
Write-Host "🗑️  Step 3: Removing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Path "node_modules/.cache" -Recurse -Force
    Write-Host "✅ Cache removed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Cache not found (already clean)" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Clear pnpm cache
Write-Host "🗑️  Step 4: Clearing pnpm cache..." -ForegroundColor Yellow
pnpm store prune
Write-Host "✅ pnpm cache cleared" -ForegroundColor Green
Write-Host ""

# Step 5: Reinstall dependencies
Write-Host "📦 Step 5: Reinstalling dependencies..." -ForegroundColor Yellow
pnpm install
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 6: Build shared packages
Write-Host "🔨 Step 6: Building shared packages..." -ForegroundColor Yellow
Set-Location "packages/shared"
pnpm build
Set-Location "../.."
Write-Host "✅ Shared packages built" -ForegroundColor Green
Write-Host ""

# Step 7: Start dev server
Write-Host "🚀 Step 7: Starting dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Clean build complete!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Run: pnpm dev" -ForegroundColor White
Write-Host "   2. Open: localhost:3000/booking-luxury" -ForegroundColor White
Write-Host "   3. Look for green badge in bottom-right corner:" -ForegroundColor White
Write-Host "      '✅ Dataset Fix v3 • 2025-10-07T01:00'" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 To verify in Console (F12):" -ForegroundColor Yellow
Write-Host "   Search for: '🚀 WhereAndWhatStep loaded - Dataset Validation Fix v3'" -ForegroundColor White
Write-Host ""

# Prompt to start dev server
$startDev = Read-Host "Start dev server now? (Y/N)"
if ($startDev -eq "Y" -or $startDev -eq "y") {
    Write-Host ""
    Write-Host "🚀 Starting dev server..." -ForegroundColor Green
    Write-Host ""
    pnpm dev
}
