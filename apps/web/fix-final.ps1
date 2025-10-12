# Final comprehensive fix for all auth issues

# Function to fix a single file
function Fix-FinalFile {
    param($FilePath)
    
    if (-not (Test-Path $FilePath)) {
        return
    }
    
    $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
    if (-not $content) {
        return
    }
    
    $modified = $false
    
    # Fix Request to NextRequest in function signatures
    $content = $content -replace "export async function GET\(request: Request\)", "export async function GET(request: NextRequest)"
    $content = $content -replace "export async function POST\(request: Request\)", "export async function POST(request: NextRequest)"
    $content = $content -replace "export async function PUT\(request: Request\)", "export async function PUT(request: NextRequest)"
    $content = $content -replace "export async function DELETE\(request: Request\)", "export async function DELETE(request: NextRequest)"
    $content = $content -replace "export async function PATCH\(request: Request\)", "export async function PATCH(request: NextRequest)"
    
    # Fix functions that don't have request parameter but use it
    if ($content -match "requireDriver\(request\)" -and $content -notmatch "export async function \w+\(request:") {
        $content = $content -replace "export async function GET\(\)", "export async function GET(request: NextRequest)"
        $content = $content -replace "export async function POST\(\)", "export async function POST(request: NextRequest)"
        $content = $content -replace "export async function PUT\(\)", "export async function PUT(request: NextRequest)"
        $content = $content -replace "export async function DELETE\(\)", "export async function DELETE(request: NextRequest)"
        $content = $content -replace "export async function PATCH\(\)", "export async function PATCH(request: NextRequest)"
        $modified = $true
    }
    
    if ($content -match "requireAdmin\(request\)" -and $content -notmatch "export async function \w+\(request:") {
        $content = $content -replace "export async function GET\(\)", "export async function GET(request: NextRequest)"
        $content = $content -replace "export async function POST\(\)", "export async function POST(request: NextRequest)"
        $content = $content -replace "export async function PUT\(\)", "export async function PUT(request: NextRequest)"
        $content = $content -replace "export async function DELETE\(\)", "export async function DELETE(request: NextRequest)"
        $content = $content -replace "export async function PATCH\(\)", "export async function PATCH(request: NextRequest)"
        $modified = $true
    }
    
    if ($content -match "requireRole\(request\)" -and $content -notmatch "export async function \w+\(request:") {
        $content = $content -replace "export async function GET\(\)", "export async function GET(request: NextRequest)"
        $content = $content -replace "export async function POST\(\)", "export async function POST(request: NextRequest)"
        $content = $content -replace "export async function PUT\(\)", "export async function PUT(request: NextRequest)"
        $content = $content -replace "export async function DELETE\(\)", "export async function DELETE(request: NextRequest)"
        $content = $content -replace "export async function PATCH\(\)", "export async function PATCH(request: NextRequest)"
        $modified = $true
    }
    
    # Add NextRequest import if missing
    if ($content -match "NextRequest" -and $content -notmatch "import.*NextRequest") {
        if ($content -match "import.*from 'next/server';") {
            $content = $content -replace "import \{ ([^}]+) \} from 'next/server';", "import { `$1, NextRequest } from 'next/server';"
        } else {
            $content = "import { NextRequest, NextResponse } from 'next/server';`n" + $content
        }
        $modified = $true
    }
    
    if ($modified) {
        Write-Host "Fixed: $FilePath"
        Set-Content $FilePath $content -NoNewline
    }
}

# Find all API route files
$apiFiles = Get-ChildItem -Path "src/app/api" -Recurse -Filter "*.ts" | Where-Object { $_.Name -eq "route.ts" }

Write-Host "Found $($apiFiles.Count) API files to check"

# Process each file
foreach ($file in $apiFiles) {
    try {
        Fix-FinalFile -FilePath $file.FullName
    } catch {
        Write-Warning "Error processing $($file.FullName): $($_.Exception.Message)"
    }
}

Write-Host "Final fixes completed!"
