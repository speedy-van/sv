# App Store Submission - Pre-Flight Verification Script
# Run this before submitting to catch issues early

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SPEEDY VAN - APP STORE PRE-FLIGHT CHECK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# 1. Check URLs
Write-Host "Step 1: Verifying URLs..." -ForegroundColor Yellow
Write-Host ""

$urls = @(
    "https://speedy-van.co.uk/privacy",
    "https://speedy-van.co.uk/terms",
    "https://speedy-van.co.uk/support",
    "https://speedy-van.co.uk/contact"
)

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ $url - OK" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $url - HTTP $($response.StatusCode)" -ForegroundColor Red
            $allPassed = $false
        }
    } catch {
        Write-Host "  ❌ $url - FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""

# 2. Check Backend Health
Write-Host "Step 2: Checking Backend Health..." -ForegroundColor Yellow
Write-Host ""

try {
    $healthUrl = "https://speedy-van.co.uk/api/health"
    $response = Invoke-WebRequest -Uri $healthUrl -Method Get -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Backend API - OK" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Backend API - HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Backend API - Not responding (check if this is expected)" -ForegroundColor Yellow
}

Write-Host ""

# 3. Check Assets
Write-Host "Step 3: Verifying App Assets..." -ForegroundColor Yellow
Write-Host ""

$iconPath = "assets/icon.png"
if (Test-Path $iconPath) {
    $icon = Get-Item $iconPath
    Write-Host "  ✅ App Icon found - $($icon.Length) bytes" -ForegroundColor Green
} else {
    Write-Host "  ❌ App Icon NOT FOUND at $iconPath" -ForegroundColor Red
    $allPassed = $false
}

$screenshotPath = "appstore-assets/screenshots"
if (Test-Path $screenshotPath) {
    $screenshots = Get-ChildItem -Path $screenshotPath -Recurse -Filter "*.png" -ErrorAction SilentlyContinue
    if ($screenshots.Count -gt 0) {
        Write-Host "  ✅ Screenshots folder found - $($screenshots.Count) images" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Screenshots folder empty - please add screenshots" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  Screenshots folder not found (create: appstore-assets/screenshots/)" -ForegroundColor Yellow
}

Write-Host ""

# 4. Check Configuration Files
Write-Host "Step 4: Checking Configuration..." -ForegroundColor Yellow
Write-Host ""

$appJsonPath = "app.json"
if (Test-Path $appJsonPath) {
    $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    Write-Host "  ✅ app.json found" -ForegroundColor Green
    Write-Host "     Version: $($appJson.expo.version)" -ForegroundColor Gray
    Write-Host "     Bundle ID: $($appJson.expo.ios.bundleIdentifier)" -ForegroundColor Gray
} else {
    Write-Host "  ❌ app.json NOT FOUND" -ForegroundColor Red
    $allPassed = $false
}

$easJsonPath = "eas.json"
if (Test-Path $easJsonPath) {
    Write-Host "  ✅ eas.json found" -ForegroundColor Green
} else {
    Write-Host "  ❌ eas.json NOT FOUND" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# 5. Check Documentation
Write-Host "Step 5: Checking Documentation..." -ForegroundColor Yellow
Write-Host ""

$docs = @(
    "appstore-assets/APP_STORE_CONTENT.md",
    "appstore-assets/REVIEWER_QA.md",
    "appstore-assets/SCREENSHOT_GUIDE.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "  ✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $doc - Not found" -ForegroundColor Yellow
    }
}

Write-Host ""

# 6. Test Account Verification Reminder
Write-Host "Step 6: Test Account Checklist..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  ⚠️  MANUAL VERIFICATION REQUIRED:" -ForegroundColor Yellow
Write-Host "     [ ] Login works (zadfad41@gmail.com / 112233)" -ForegroundColor Gray
Write-Host "     [ ] Dashboard shows earnings data" -ForegroundColor Gray
Write-Host "     [ ] Routes are visible" -ForegroundColor Gray
Write-Host "     [ ] Can complete full delivery flow" -ForegroundColor Gray
Write-Host "     [ ] Backend responds to requests" -ForegroundColor Gray
Write-Host ""

# 7. Final Summary
Write-Host "========================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "[PASSED] PRE-FLIGHT CHECK PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "All automated checks passed!" -ForegroundColor Green
    Write-Host "Complete manual test account verification, then proceed with submission." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next step:" -ForegroundColor Yellow
    Write-Host "  eas build --platform ios --profile production --auto-submit" -ForegroundColor White
} else {
    Write-Host "[FAILED] PRE-FLIGHT CHECK FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Some checks failed. Please fix issues above before submitting." -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

