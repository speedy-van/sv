# Production HTML Viewport Verification Script
# Run after build completes: pnpm -C apps/web start -p 3000

Write-Host "=== VIEWPORT VERIFICATION ===" -ForegroundColor Cyan
Write-Host ""

# Wait for server to be ready
Write-Host "Waiting for server to respond..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    # Fetch homepage HTML
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    $html = $response.Content
    
    # Extract first 150 lines of HTML
    $lines = $html -split "`n" | Select-Object -First 150
    
    Write-Host "=== FIRST 150 LINES OF HTML ===" -ForegroundColor Green
    Write-Host ""
    $lines | ForEach-Object { Write-Host $_ }
    
    Write-Host ""
    Write-Host "=== VIEWPORT META TAG SEARCH ===" -ForegroundColor Green
    Write-Host ""
    
    # Search for viewport
    $viewportLines = $html -split "`n" | Select-String -Pattern 'viewport' -CaseSensitive:$false
    
    if ($viewportLines.Count -eq 0) {
        Write-Host "❌ NO VIEWPORT META TAG FOUND" -ForegroundColor Red
        Write-Host "   This is the ROOT CAUSE - mobile browsers default to 980px" -ForegroundColor Red
    }
    elseif ($viewportLines.Count -eq 1) {
        Write-Host "✅ VIEWPORT META TAG FOUND (exactly once)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Content:" -ForegroundColor Yellow
        $viewportLines | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
        Write-Host ""
        Write-Host "   Viewport IS configured. Root cause is NOT missing viewport." -ForegroundColor Green
        Write-Host "   Need to investigate CSS/layout issues instead." -ForegroundColor Yellow
    }
    else {
        Write-Host "⚠️ MULTIPLE VIEWPORT META TAGS FOUND ($($viewportLines.Count) occurrences)" -ForegroundColor Red
        Write-Host "   This causes conflicts. Keep only ONE." -ForegroundColor Red
        Write-Host ""
        $viewportLines | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    }
    
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    Write-Host "   Make sure production server is running on port 3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== END ===" -ForegroundColor Cyan
