# Comprehensive script to fix all remaining auth errors

# Function to fix a single file
function Fix-RemainingFile {
    param($FilePath)
    
    if (-not (Test-Path $FilePath)) {
        return
    }
    
    $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
    if (-not $content) {
        return
    }
    
    $modified = $false
    
    # Fix requireDriver() calls without request parameter
    if ($content -match "const session = await requireDriver\(\);") {
        $content = $content -replace "const session = await requireDriver\(\);\s*\n\s*if \(!session\) \{\s*\n\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\n\s*\}", "const authResult = await requireDriver(request);`n    if (authResult instanceof NextResponse) {`n      return authResult;`n    }`n    const { user, session } = authResult;"
        $modified = $true
    }
    
    # Fix requireAdmin() calls without request parameter
    if ($content -match "const session = await requireAdmin\(\);") {
        $content = $content -replace "const session = await requireAdmin\(\);\s*\n\s*if \(!session\) \{\s*\n\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\n\s*\}", "const authResult = await requireAdmin(request);`n    if (authResult instanceof NextResponse) {`n      return authResult;`n    }`n    const { user, session } = authResult;"
        $modified = $true
    }
    
    # Fix requireRole() calls without request parameter
    if ($content -match "const session = await requireRole\('([^']+)'\);") {
        $content = $content -replace "const session = await requireRole\('([^']+)'\);\s*\n\s*if \(!session\) \{\s*\n\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\n\s*\}", "const authResult = await requireRole(request, ['`$1']);`n    if (authResult instanceof NextResponse) {`n      return authResult;`n    }`n    const { user, session } = authResult;"
        $modified = $true
    }
    
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
        Fix-RemainingFile -FilePath $file.FullName
    } catch {
        Write-Warning "Error processing $($file.FullName): $($_.Exception.Message)"
    }
}

Write-Host "Remaining errors fixes completed!"
