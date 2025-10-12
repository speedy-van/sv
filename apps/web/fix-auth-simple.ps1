# Simple PowerShell script to fix auth function calls

# Function to fix a single file
function Fix-AuthFile {
    param($FilePath)
    
    $content = Get-Content $FilePath
    $modified = $false
    
    for ($i = 0; $i -lt $content.Length; $i++) {
        $line = $content[$i]
        
        # Fix requireAdmin() calls
        if ($line -match "const session = await requireAdmin\(\);") {
            $content[$i] = "    const authResult = await requireAdmin(request);"
            $content[$i+1] = "    if (authResult instanceof NextResponse) {"
            $content[$i+2] = "      return authResult;"
            $content[$i+3] = "    }"
            $content[$i+4] = "    const { user, session } = authResult;"
            $modified = $true
        }
        
        # Fix requireDriver() calls
        if ($line -match "const session = await requireDriver\(\);") {
            $content[$i] = "    const authResult = await requireDriver(request);"
            $content[$i+1] = "    if (authResult instanceof NextResponse) {"
            $content[$i+2] = "      return authResult;"
            $content[$i+3] = "    }"
            $content[$i+4] = "    const { user, session } = authResult;"
            $modified = $true
        }
        
        # Fix requireRole() calls
        if ($line -match "const session = await requireRole\('([^']+)'\);") {
            $role = $matches[1]
            if ($role -eq "admin") {
                $content[$i] = "    const authResult = await requireAdmin(request);"
            } elseif ($role -eq "driver") {
                $content[$i] = "    const authResult = await requireDriver(request);"
            } else {
                $content[$i] = "    const authResult = await requireRole(request, ['$role']);"
            }
            $content[$i+1] = "    if (authResult instanceof NextResponse) {"
            $content[$i+2] = "      return authResult;"
            $content[$i+3] = "    }"
            $content[$i+4] = "    const { user, session } = authResult;"
            $modified = $true
        }
    }
    
    if ($modified) {
        Write-Host "Fixed: $FilePath"
        Set-Content $FilePath $content
    }
}

# Find all API route files
$apiFiles = Get-ChildItem -Path "src/app/api" -Recurse -Filter "route.ts"

Write-Host "Found $($apiFiles.Count) API files to check"

# Process each file
foreach ($file in $apiFiles) {
    Fix-AuthFile -FilePath $file.FullName
}

Write-Host "Auth fixes completed!"
