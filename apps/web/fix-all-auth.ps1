# Comprehensive script to fix all auth issues

# Function to fix a single file
function Fix-AllAuthFile {
    param($FilePath)
    
    if (-not (Test-Path $FilePath)) {
        return
    }
    
    $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
    if (-not $content) {
        return
    }
    
    $modified = $false
    
    # Fix Request type to NextRequest
    if ($content -match "export async function GET\(request: Request\)") {
        $content = $content -replace "export async function GET\(request: Request\)", "export async function GET(request: NextRequest)"
        $content = $content -replace "export async function POST\(request: Request\)", "export async function POST(request: NextRequest)"
        $content = $content -replace "export async function PUT\(request: Request\)", "export async function PUT(request: NextRequest)"
        $content = $content -replace "export async function DELETE\(request: Request\)", "export async function DELETE(request: NextRequest)"
        $content = $content -replace "export async function PATCH\(request: Request\)", "export async function PATCH(request: NextRequest)"
        $modified = $true
    }
    
    # Fix requireAdmin() calls without request parameter
    if ($content -match "const session = await requireAdmin\(\);") {
        $content = $content -replace "const session = await requireAdmin\(\);\s*\n\s*if \(!session\) \{\s*\n\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\n\s*\}", "const authResult = await requireAdmin(request);`n    if (authResult instanceof NextResponse) {`n      return authResult;`n    }`n    const { user, session } = authResult;"
        $modified = $true
    }
    
    # Fix requireDriver() calls without request parameter
    if ($content -match "const session = await requireDriver\(\);") {
        $content = $content -replace "const session = await requireDriver\(\);\s*\n\s*if \(!session\) \{\s*\n\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\n\s*\}", "const authResult = await requireDriver(request);`n    if (authResult instanceof NextResponse) {`n      return authResult;`n    }`n    const { user, session } = authResult;"
        $modified = $true
    }
    
    # Fix requireRole() calls without request parameter
    if ($content -match "const session = await requireRole\('([^']+)'\);") {
        $content = $content -replace "const session = await requireRole\('([^']+)'\);\s*\n\s*if \(!session\) \{\s*\n\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\n\s*\}", "const authResult = await requireRole(request, ['`$1']);`n    if (authResult instanceof NextResponse) {`n      return authResult;`n    }`n    const { user, session } = authResult;"
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
        Fix-AllAuthFile -FilePath $file.FullName
    } catch {
        Write-Warning "Error processing $($file.FullName): $($_.Exception.Message)"
    }
}

Write-Host "All auth fixes completed!"
