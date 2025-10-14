# Test Driver JWT Token
$API_BASE_URL = "https://speedy-van.co.uk"
$email = "zadfad41@gmail.com"
$password = "112233"

Write-Host "Testing Driver Login JWT Token..." -ForegroundColor Cyan
Write-Host ""

$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$API_BASE_URL/api/driver/auth/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30

    $result = $response.Content | ConvertFrom-Json

    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Token Details:" -ForegroundColor Yellow
    Write-Host "  Length: $($result.token.Length) characters" -ForegroundColor Gray
    Write-Host "  First 20 chars: $($result.token.Substring(0, [Math]::Min(20, $result.token.Length)))..." -ForegroundColor Gray
    Write-Host ""
    
    # Split by dots
    $parts = $result.token -split '\.'
    Write-Host "Token Parts: $($parts.Length)" -ForegroundColor Yellow
    
    if ($parts.Length -eq 3) {
        Write-Host "  JWT Format: VALID" -ForegroundColor Green
        Write-Host "  Header length: $($parts[0].Length)" -ForegroundColor Gray
        Write-Host "  Payload length: $($parts[1].Length)" -ForegroundColor Gray
        Write-Host "  Signature length: $($parts[2].Length)" -ForegroundColor Gray
        
        # Try to decode header
        try {
            $headerBytes = [System.Convert]::FromBase64String($parts[0] + "==")
            $headerJson = [System.Text.Encoding]::UTF8.GetString($headerBytes)
            Write-Host ""
            Write-Host "  Header: $headerJson" -ForegroundColor Cyan
        } catch {
            Write-Host "  Could not decode header" -ForegroundColor Yellow
        }
        
        # Try to decode payload
        try {
            $payloadBytes = [System.Convert]::FromBase64String($parts[1] + "==")
            $payloadJson = [System.Text.Encoding]::UTF8.GetString($payloadBytes)
            Write-Host "  Payload: $payloadJson" -ForegroundColor Cyan
        } catch {
            Write-Host "  Could not decode payload" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  JWT Format: INVALID (expected 3 parts, got $($parts.Length))" -ForegroundColor Red
        Write-Host ""
        Write-Host "Full token:" -ForegroundColor Yellow
        Write-Host $result.token -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "User Info:" -ForegroundColor Yellow
    Write-Host "  ID: $($result.user.id)" -ForegroundColor Gray
    Write-Host "  Email: $($result.user.email)" -ForegroundColor Gray
    Write-Host "  Name: $($result.user.name)" -ForegroundColor Gray
    Write-Host "  Role: $($result.user.role)" -ForegroundColor Gray

} catch {
    Write-Host "Login failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

