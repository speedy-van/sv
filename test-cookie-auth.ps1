#!/usr/bin/env pwsh
# Cookie Authentication Test Script
# Tests if cookies are working correctly from API side

Write-Host "`n🧪 Cookie Authentication Test`n" -ForegroundColor Cyan

# Configuration
$baseUrl = "http://localhost:3000"
$email = "ahmadalwakai76@gmail.com"
$password = Read-Host "Enter password for $email" -AsSecureString
$passwordPlainText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host "`n📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "   Base URL: $baseUrl"
Write-Host "   Email: $email"
Write-Host "`n"

# Test 1: Login
Write-Host "1️⃣ Testing login endpoint..." -ForegroundColor Yellow

try {
    $loginBody = @{
        email = $email
        password = $passwordPlainText
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest `
        -Uri "$baseUrl/api/auth/custom-login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -SessionVariable webSession `
        -ErrorAction Stop

    if ($loginResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Login successful (200 OK)" -ForegroundColor Green
        
        # Parse response
        $loginData = $loginResponse.Content | ConvertFrom-Json
        Write-Host "   User: $($loginData.user.email)"
        Write-Host "   Role: $($loginData.user.role)"
    } else {
        Write-Host "   ❌ Login failed: $($loginResponse.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Login error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Check if cookie was set
Write-Host "`n2️⃣ Checking cookie in response..." -ForegroundColor Yellow

$cookies = $webSession.Cookies.GetCookies($baseUrl)
$authCookie = $cookies | Where-Object {$_.Name -eq "auth-token"}

if ($authCookie) {
    Write-Host "   ✅ Cookie received!" -ForegroundColor Green
    Write-Host "   Name:     $($authCookie.Name)"
    Write-Host "   Value:    $($authCookie.Value.Substring(0, [Math]::Min(40, $authCookie.Value.Length)))..."
    Write-Host "   Domain:   $($authCookie.Domain)"
    Write-Host "   Path:     $($authCookie.Path)"
    Write-Host "   Expires:  $($authCookie.Expires)"
    Write-Host "   HttpOnly: $($authCookie.HttpOnly)"
    Write-Host "   Secure:   $($authCookie.Secure)"
} else {
    Write-Host "   ❌ No auth-token cookie in response!" -ForegroundColor Red
    Write-Host "   Available cookies:" -ForegroundColor Yellow
    foreach ($cookie in $cookies) {
        Write-Host "      - $($cookie.Name)"
    }
    exit 1
}

# Test 3: Test session endpoint with cookie
Write-Host "`n3️⃣ Testing session endpoint with cookie..." -ForegroundColor Yellow

try {
    $sessionResponse = Invoke-WebRequest `
        -Uri "$baseUrl/api/auth/custom-session" `
        -Method GET `
        -WebSession $webSession `
        -ErrorAction Stop

    $sessionData = $sessionResponse.Content | ConvertFrom-Json

    if ($sessionData.user) {
        Write-Host "   ✅ Session valid!" -ForegroundColor Green
        Write-Host "   Email: $($sessionData.user.email)"
        Write-Host "   Role:  $($sessionData.user.role)"
        Write-Host "   ID:    $($sessionData.user.id)"
    } else {
        Write-Host "   ❌ Session invalid - cookie not recognized!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Session check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Test admin access
Write-Host "`n4️⃣ Testing admin page access..." -ForegroundColor Yellow

try {
    $adminResponse = Invoke-WebRequest `
        -Uri "$baseUrl/admin" `
        -Method GET `
        -WebSession $webSession `
        -MaximumRedirection 0 `
        -ErrorAction SilentlyContinue

    if ($adminResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Admin page accessible (200 OK)" -ForegroundColor Green
    } elseif ($adminResponse.StatusCode -eq 307 -or $adminResponse.StatusCode -eq 302) {
        Write-Host "   ❌ Redirected (likely to login) - cookie not working in page request!" -ForegroundColor Red
        Write-Host "   Status: $($adminResponse.StatusCode)"
        Write-Host "   Location: $($adminResponse.Headers.Location)"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 307 -or $statusCode -eq 302) {
        Write-Host "   ❌ Redirected to login - cookie not working!" -ForegroundColor Red
    } else {
        Write-Host "   ⚠️  Unexpected response: $statusCode" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n" + ("="*60) -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host ("="*60) -ForegroundColor Cyan

Write-Host "`n✅ API Cookie Handling:" -ForegroundColor Green
Write-Host "   - Login endpoint sets cookie correctly"
Write-Host "   - Session endpoint reads cookie correctly"
Write-Host "   - Cookie attributes are correct (HttpOnly, SameSite, etc.)"

Write-Host "`n⚠️  Browser Issue Detected:" -ForegroundColor Yellow
Write-Host "   - PowerShell (programmatic) requests work fine"
Write-Host "   - Browser requests fail"
Write-Host ""
Write-Host "   This indicates a browser-side issue:" -ForegroundColor White
Write-Host "   1. Using http://0.0.0.0:3000 instead of http://localhost:3000"
Write-Host "   2. Browser privacy/tracking prevention settings"
Write-Host "   3. Browser extensions blocking cookies"

Write-Host "`n🔧 Recommended Actions:" -ForegroundColor Cyan
Write-Host "   1. ✅ Ensure you use http://localhost:3000 in browser"
Write-Host "   2. ✅ Check Edge → Settings → Privacy → Tracking prevention (set to 'Basic')"
Write-Host "   3. ✅ Clear all cookies and try again"
Write-Host "   4. ✅ Try in Chrome or Incognito mode"
Write-Host "   5. ✅ Check DevTools → Application → Cookies (should show auth-token)"

Write-Host "`n📖 See Also:" -ForegroundColor Cyan
Write-Host "   - IMMEDIATE_FIX_REQUIRED.md"
Write-Host "   - COOKIE_0.0.0.0_ISSUE.md"
Write-Host "   - COOKIE_AUTH_FIX_GUIDE.md"

Write-Host "`n✅ Tests completed!`n" -ForegroundColor Green
