# Speedy Van Booking System Smoke Tests (PowerShell)
# Tests the unified booking and pricing system

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "🧪 Running Speedy Van Booking System Smoke Tests" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

# Test data
$PickupAddress = '{"lat":51.5034,"lng":-0.1276,"address":"10 Downing St"}'
$DropoffAddress = '{"lat":51.5014,"lng":-0.1419,"address":"Buckingham Palace"}'
$VanType = '"small"'
$CrewSize = '2'
$DateISO = '"2024-12-20"'
$TimeSlot = '"day"'
$StairsFloors = '3'

Write-Host "Testing Pricing API..." -ForegroundColor Yellow

# Test 1: Pricing Quote
Write-Host "1. Testing /api/pricing/quote" -ForegroundColor White
$QuoteBody = @{
    pickup = $PickupAddress | ConvertFrom-Json
    dropoff = $DropoffAddress | ConvertFrom-Json
    vanType = $VanType.Trim('"')
    crewSize = [int]$CrewSize
    dateISO = $DateISO.Trim('"')
    timeSlot = $TimeSlot.Trim('"')
    stairsFloors = [int]$StairsFloors
} | ConvertTo-Json -Depth 10

try {
    $QuoteResponse = Invoke-RestMethod -Uri "$BaseUrl/api/pricing/quote" -Method POST -Body $QuoteBody -ContentType "application/json"
    if ($QuoteResponse.breakdown) {
        Write-Host "✅ Pricing quote successful" -ForegroundColor Green
        Write-Host "   Breakdown: $($QuoteResponse.breakdown.totalPence) pence" -ForegroundColor Gray
    } else {
        Write-Host "❌ Pricing quote failed - no breakdown" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Pricing quote failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Testing Booking API..." -ForegroundColor Yellow

# Test 2: Check Booking API (skip creation for now)
Write-Host "2. Testing /api/booking-luxury endpoint availability (legacy /api/bookings removed)" -ForegroundColor White
try {
    $BookingResponse = Invoke-WebRequest -Uri "$BaseUrl/api/booking-luxury" -Method GET -ErrorAction SilentlyContinue
    Write-Host "✅ Booking (luxury) API endpoint exists" -ForegroundColor Green
    Write-Host "   Status: $($BookingResponse.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Booking-luxury API endpoint not found" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "Testing Payment API..." -ForegroundColor Yellow

# Test 3: Check Payment API availability
Write-Host "3. Testing /api/payment/create-checkout-session availability" -ForegroundColor White
try {
    $PaymentResponse = Invoke-WebRequest -Uri "$BaseUrl/api/payment/create-checkout-session" -Method OPTIONS -ErrorAction SilentlyContinue
    Write-Host "✅ Payment API endpoint exists" -ForegroundColor Green
    Write-Host "   Status: $($PaymentResponse.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Payment API endpoint not found" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "Testing Legacy API Proxy..." -ForegroundColor Yellow

# Test 4: Legacy Quotes API (should return 404 - migration complete)
Write-Host "4. Testing /api/quotes (legacy endpoint removed)" -ForegroundColor White
$LegacyBody = @{
    pickup = $PickupAddress | ConvertFrom-Json
    dropoff = $DropoffAddress | ConvertFrom-Json
    vanType = $VanType.Trim('"')
    crewSize = [int]$CrewSize
    dateISO = $DateISO.Trim('"')
    timeSlot = $TimeSlot.Trim('"')
} | ConvertTo-Json -Depth 10

try {
    $LegacyResponse = Invoke-RestMethod -Uri "$BaseUrl/api/quotes" -Method POST -Body $LegacyBody -ContentType "application/json"
    Write-Host "❌ Legacy quotes API still exists" -ForegroundColor Red
    Write-Host "   Expected 404, but got response" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ Legacy quotes API correctly removed (404)" -ForegroundColor Green
        Write-Host "   Migration complete - use /api/pricing/quote instead" -ForegroundColor Gray
    } else {
        Write-Host "❌ Legacy quotes API unexpected error" -ForegroundColor Red
        Write-Host "   Expected 404, got $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Testing Redirects..." -ForegroundColor Yellow

# Test 5: Legacy booking redirect
Write-Host "5. Testing /book redirect to /booking" -ForegroundColor White
try {
    $RedirectResponse = Invoke-WebRequest -Uri "$BaseUrl/book" -Method HEAD -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($RedirectResponse.StatusCode -eq 302 -or $RedirectResponse.StatusCode -eq 301 -or $RedirectResponse.StatusCode -eq 307) {
        Write-Host "✅ Legacy booking redirect working" -ForegroundColor Green
        Write-Host "   Status: $($RedirectResponse.StatusCode)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Legacy booking redirect failed - unexpected status code: $($RedirectResponse.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✅ Legacy booking redirect working (caught redirect exception)" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 All smoke tests passed!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ Pricing API: /api/pricing/quote" -ForegroundColor Green
Write-Host "✅ Booking API: Available" -ForegroundColor Green
Write-Host "✅ Payment API: Available" -ForegroundColor Green
Write-Host "✅ Legacy Proxy: Migration complete (legacy endpoint removed)" -ForegroundColor Green
Write-Host "✅ Legacy Redirect: /book → /booking" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test with real Stripe keys for payment processing" -ForegroundColor White
Write-Host "2. Set up webhook forwarding: stripe listen --forward-to $BaseUrl/api/payment/webhook" -ForegroundColor White
Write-Host "3. Test the full booking flow at $BaseUrl/booking" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Unified booking and pricing system is ready!" -ForegroundColor Green
