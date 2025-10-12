# Script to add missing NextRequest imports

# Function to fix imports in a single file
function Fix-Imports {
    param($FilePath)
    
    if (-not (Test-Path $FilePath)) {
        return
    }
    
    $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
    if (-not $content) {
        return
    }
    
    $modified = $false
    
    # Check if file uses NextRequest but doesn't import it
    if ($content -match "NextRequest" -and $content -notmatch "import.*NextRequest") {
        # Add NextRequest import at the top
        if ($content -match "import.*from 'next/server';") {
            # Already has next/server import, add NextRequest to it
            $content = $content -replace "import \{ ([^}]+) \} from 'next/server';", "import { `$1, NextRequest } from 'next/server';"
        } else {
            # Add new import
            $content = "import { NextRequest, NextResponse } from 'next/server';`n" + $content
        }
        $modified = $true
    }
    
    if ($modified) {
        Write-Host "Fixed imports: $FilePath"
        Set-Content $FilePath $content -NoNewline
    }
}

# Find all API route files
$apiFiles = Get-ChildItem -Path "src/app/api" -Recurse -Filter "*.ts" | Where-Object { $_.Name -eq "route.ts" }

Write-Host "Found $($apiFiles.Count) API files to check"

# Process each file
foreach ($file in $apiFiles) {
    try {
        Fix-Imports -FilePath $file.FullName
    } catch {
        Write-Warning "Error processing $($file.FullName): $($_.Exception.Message)"
    }
}

Write-Host "Import fixes completed!"
