#!/usr/bin/env pwsh
# Quick Clean Build - Just removes .next and restarts

Write-Host "🧹 Quick Clean..." -ForegroundColor Cyan

# Kill any running node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove .next
if (Test-Path "apps/web/.next") {
    Remove-Item -Path "apps/web/.next" -Recurse -Force
    Write-Host "✅ Removed .next" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Clean complete! Now run: pnpm dev" -ForegroundColor Green
Write-Host ""
