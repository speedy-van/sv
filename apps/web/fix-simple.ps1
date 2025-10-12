# Simple PowerShell script to fix TypeScript errors

Write-Host "Starting fixes..."

$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix common field names
    $content = $content -replace '\.code\b', '.reference'
    $content = $content -replace '\bcode:', 'reference:'
    $content = $content -replace '\.preferredDate\b', '.scheduledAt'
    $content = $content -replace '\bpreferredDate:', 'scheduledAt:'
    $content = $content -replace '\.amountPence\b', '.totalGBP'
    $content = $content -replace '\bamountPence:', 'totalGBP:'
    $content = $content -replace '\.paymentStatus\b', '.status'
    $content = $content -replace '\bpaymentStatus:', 'status:'
    
    # Fix relation names
    $content = $content -replace '\bassignment:', 'Assignment:'
    $content = $content -replace '\bbooking:', 'Booking:'
    $content = $content -replace '\bbookings:', 'Booking:'
    $content = $content -replace '\bassignments:', 'Assignment:'
    
    # Fix status values
    $content = $content -replace "'open'", "'DRAFT'"
    $content = $content -replace "'confirmed'", "'CONFIRMED'"
    $content = $content -replace "'assigned'", "'CONFIRMED'"
    $content = $content -replace "'completed'", "'COMPLETED'"
    $content = $content -replace "'cancelled'", "'CANCELLED'"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "Done!"
