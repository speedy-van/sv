# Test pricing API using PowerShell
$testData = @{
    items = @(
        @{
            id = "full-house-1bed"
            name = "1 Bedroom House Package"
            category = "full-house"
            quantity = 1
            weight = 1500
            volume = 15.0
            fragile = $false
            oversize = $true
            disassemblyRequired = $false
            specialHandling = @()
        }
    )
    pickupAddress = @{
        address = "123 Test Street, London, SW1A 1AA"
        postcode = "SW1A 1AA"
        coordinates = @{
            lat = 51.5074
            lng = -0.1278
        }
    }
    dropoffAddress = @{
        address = "456 Test Avenue, Manchester, M1 1AA"
        postcode = "M1 1AA"
        coordinates = @{
            lat = 53.483959
            lng = -2.244644
        }
    }
    pickupProperty = @{
        type = "house"
        floors = 0
        hasLift = $false
        hasParking = $true
        accessNotes = $null
        requiresPermit = $false
    }
    dropoffProperty = @{
        type = "house"
        floors = 0
        hasLift = $false
        hasParking = $true
        accessNotes = $null
        requiresPermit = $false
    }
    serviceType = "standard"
    pickupDate = (Get-Date).ToString("yyyy-MM-dd")
    pickupTimeSlot = "flexible"
    urgency = "scheduled"
    distance = 0
    estimatedDuration = 0
    pricing = @{
        baseFee = 0
        distanceFee = 0
        volumeFee = 0
        serviceFee = 0
        urgencyFee = 0
        vat = 0
        total = 0
        distance = 0
    }
} | ConvertTo-Json -Depth 10

Write-Host "🔍 Testing pricing API..."
Write-Host "Items: $($testData.items.Count)"
Write-Host "Pickup: $($testData.pickupAddress.postcode)"
Write-Host "Dropoff: $($testData.dropoffAddress.postcode)"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/pricing/quote" -Method POST -Body $testData -ContentType "application/json" -Headers @{"X-Correlation-ID"="debug-$(Get-Date -UFormat %s)"} -TimeoutSec 30

    Write-Host "📡 Response status: $($response.StatusCode)"

    $result = $response.Content | ConvertFrom-Json

    if ($result.success) {
        Write-Host "✅ Pricing calculated: £"($result.data.amountGbpMinor / 100).ToString("F2")
        Write-Host "📋 Breakdown:" -ForegroundColor Green
        Write-Host "  Base Fee: £"($result.data.breakdown.baseFee / 100).ToString("F2")
        Write-Host "  Distance Fee: £"($result.data.breakdown.distanceFee / 100).ToString("F2")
        Write-Host "  Items Fee: £"($result.data.breakdown.itemsFee / 100).ToString("F2")
        Write-Host "  Service Fee: £"($result.data.breakdown.serviceFee / 100).ToString("F2")
        Write-Host "  VAT: £"($result.data.vatAmount / 100).ToString("F2")
    } else {
        Write-Host "❌ API Error: $($result.error)" -ForegroundColor Red
        if ($result.details) {
            Write-Host "Details: $($result.details)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
}
