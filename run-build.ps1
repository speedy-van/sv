$ErrorActionPreference = "Stop"
Set-Location "c:\sv\apps\web"
Write-Host "Current directory: $(Get-Location)"
Write-Host "Checking app directory..."
if (-not (Test-Path "src\app")) {
    Write-Host "ERROR: src\app not found!"
    exit 1
}
Write-Host "src\app exists"
Write-Host "Setting environment..."
$env:NODE_OPTIONS = '--max-old-space-size=4096'
Write-Host "Running build..."
& "c:\sv\node_modules\.bin\next.cmd" build
$code = $LASTEXITCODE
Write-Host "Build command exited with code: $code"
