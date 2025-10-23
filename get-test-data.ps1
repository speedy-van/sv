# Get available routes and drivers for testing
# Usage: .\get-test-data.ps1

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "🔍 Fetching test data..." -ForegroundColor Cyan
Write-Host ""

# Get routes
Write-Host "📋 Available Routes:" -ForegroundColor Yellow
try {
    $routes = Invoke-RestMethod -Uri "$BaseUrl/api/admin/routes" -Method GET -ErrorAction Stop
    
    if ($routes -and $routes.routes -and $routes.routes.Count -gt 0) {
        $routes.routes | Select-Object -First 5 | ForEach-Object {
            Write-Host "  • ID: $($_.id)" -ForegroundColor Green
            Write-Host "    Driver: $($_.driverId)" -ForegroundColor Gray
            Write-Host "    Status: $($_.status)" -ForegroundColor Gray
            Write-Host "    Bookings: $($_.bookingsCount)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "  No routes found" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error fetching routes: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Get available drivers
Write-Host "👷 Available Drivers:" -ForegroundColor Yellow
try {
    $drivers = Invoke-RestMethod -Uri "$BaseUrl/api/admin/drivers/available" -Method GET -ErrorAction Stop
    
    if ($drivers -and $drivers.drivers -and $drivers.drivers.Count -gt 0) {
        $drivers.drivers | Select-Object -First 5 | ForEach-Object {
            Write-Host "  • ID: $($_.id)" -ForegroundColor Green
            Write-Host "    Name: $($_.name)" -ForegroundColor Gray
            Write-Host "    Status: $($_.status)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "  No available drivers found" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error fetching drivers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Usage Example:" -ForegroundColor Cyan
Write-Host ".\test-reassign.ps1 -RouteId 'RT1A2B3C4D' -DriverId 'clxxx...'" -ForegroundColor White












