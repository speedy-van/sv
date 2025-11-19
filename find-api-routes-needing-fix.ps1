$needsFix = @()
$alreadyHas = @()

Get-ChildItem -Path "apps\web\src\app\api" -Recurse -Filter "route.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $hasFunction = ($content -match "getServerSession") -or ($content -match "headers\(\)") -or ($content -match "cookies\(\)")
    $hasDynamic = $content -match "export const dynamic"
    
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
    
    if ($hasFunction -and -not $hasDynamic) {
        $needsFix += $relativePath
    } elseif ($hasFunction -and $hasDynamic) {
        $alreadyHas += $relativePath
    }
}

Write-Host "`n=== FILES NEEDING FIX ==="
$needsFix | ForEach-Object { Write-Host $_ }

Write-Host "`n=== SUMMARY ==="
Write-Host "Files that NEED the fix: $($needsFix.Count)"
Write-Host "Files that already have it: $($alreadyHas.Count)"

# Export to JSON for processing
@{
    needsFix = $needsFix
    alreadyHas = $alreadyHas
} | ConvertTo-Json | Out-File "api-routes-fix-list.json"
