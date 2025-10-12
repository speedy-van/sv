# PowerShell script to fix auth imports in all API files

# Function to replace import and usage in files
function Fix-AuthImports {
    param($FilePath)
    
    $content = Get-Content $FilePath -Raw
    
    # Skip if file doesn't contain require functions
    if (-not ($content -match "(requireRole|requireAdmin|requireDriver)")) {
        return
    }
    
    Write-Host "Fixing: $FilePath"
    
    # Replace require imports
    $content = $content -replace "import \{ requireRole \} from '@/lib/auth';", "import { requireRole } from '@/lib/auth';"
    $content = $content -replace "import \{ requireAdmin \} from '@/lib/auth';", "import { requireAdmin } from '@/lib/auth';"
    $content = $content -replace "import \{ requireDriver \} from '@/lib/auth';", "import { requireDriver } from '@/lib/auth';"
    
    # Add missing imports if needed
    if ($content -match "requireAdmin\(" -and $content -notmatch "import.*requireAdmin") {
        $content = $content -replace "(import \{ [^}]+ \} from '@/lib/auth';)", "`$1`nimport { requireAdmin } from '@/lib/auth';"
        $content = $content -replace "import \{ requireRole \} from '@/lib/auth';", "import { requireAdmin } from '@/lib/auth';"
    }
    
    if ($content -match "requireDriver\(" -and $content -notmatch "import.*requireDriver") {
        $content = $content -replace "(import \{ [^}]+ \} from '@/lib/auth';)", "`$1`nimport { requireDriver } from '@/lib/auth';"
        $content = $content -replace "import \{ requireRole \} from '@/lib/auth';", "import { requireDriver } from '@/lib/auth';"
    }
    
    # Fix legacy requireRole usage patterns
    $content = $content -replace "const user = await requireRole\('admin'\);", @"
const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;
"@
    
    $content = $content -replace "const user = await requireRole\('driver'\);", @"
const authResult = await requireDriver(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;
"@
    
    $content = $content -replace "const authResult = await requireRole\(request, \['admin'\]\);", "const authResult = await requireAdmin(request);"
    $content = $content -replace "const authResult = await requireRole\(request, \['driver'\]\);", "const authResult = await requireDriver(request);"
    $content = $content -replace "const authResult = await requireRole\(request, \['customer'\]\);", "const authResult = await requireCustomer(request);"
    
    # Write back to file
    Set-Content $FilePath $content -NoNewline
}

# Find all API route files
$apiFiles = Get-ChildItem -Path "src/app/api" -Recurse -Filter "*.ts" | Where-Object { $_.Name -eq "route.ts" }

Write-Host "Found $($apiFiles.Count) API files to check"

# Process each file
foreach ($file in $apiFiles) {
    Fix-AuthImports -FilePath $file.FullName
}

Write-Host "Auth import fixes completed!"
