# Test Route Reassignment API
# Usage: .\test-reassign.ps1 -RouteId "your-route-id" -DriverId "your-driver-id"

param(
    [Parameter(Mandatory=$true)]
    [string]$RouteId,
    
    [Parameter(Mandatory=$true)]
    [string]$DriverId,
    
    [string]$Reason = "Testing reassignment fix",
    
    [string]$BaseUrl = "http://localhost:3000"
)

$url = "$BaseUrl/api/admin/routes/$RouteId/reassign"

$body = @{
    driverId = $DriverId
    reason = $Reason
} | ConvertTo-Json

Write-Host "🔄 Testing Route Reassignment..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host "Body: $body" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 5
    }
}












