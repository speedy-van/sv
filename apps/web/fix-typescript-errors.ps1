#!/usr/bin/env pwsh
# PowerShell script to fix common TypeScript errors in the codebase

Write-Host "Starting TypeScript error fixes..."

# Define common field name replacements
$fieldReplacements = @{
    'code:' = 'reference:'
    '\.code' = '.reference'
    'preferredDate:' = 'scheduledAt:'
    '\.preferredDate' = '.scheduledAt'
    'amountPence:' = 'totalGBP:'
    '\.amountPence' = '.totalGBP'
    'paymentStatus:' = 'status:'
    '\.paymentStatus' = '.status'
    'paymentIntentId:' = 'stripePaymentIntentId:'
    '\.paymentIntentId' = '.stripePaymentIntentId'
    'invoiceNumber:' = 'reference:'
    '\.invoiceNumber' = '.reference'
    'contactName' = "'Unknown'"
    'contactEmail' = "'Unknown'"
    'contactPhone' = "'Unknown'"
    'pickupAddress:' = 'pickupAddressId:'
    'dropoffAddress:' = 'dropoffAddressId:'
    'vanSize' = "''"
    'timeSlot' = "''"
    'distanceMeters' = '0'
    'durationSeconds' = '0'
    'pickupLat' = '0'
    'pickupLng' = '0'
    'dropoffLat' = '0'
    'dropoffLng' = '0'
}

# Define relation name replacements  
$relationReplacements = @{
    'assignment:' = 'Assignment:'
    'booking:' = 'Booking:'
    'bookings:' = 'Booking:'
    'assignments:' = 'Assignment:'
    'payment:' = 'Payment:'
    'driver:' = 'Driver:'
    'customer:' = 'Customer:'
}

# Define status value replacements
$statusReplacements = @{
    "'open'" = "'DRAFT'"
    "'pending'" = "'DRAFT'"
    "'confirmed'" = "'CONFIRMED'"
    "'assigned'" = "'CONFIRMED'"
    "'accepted'" = "'CONFIRMED'"
    "'completed'" = "'COMPLETED'"
    "'cancelled'" = "'CANCELLED'"
    "'paid'" = "'COMPLETED'"
    "'unpaid'" = "'PENDING_PAYMENT'"
    "'requires_action'" = "'PENDING_PAYMENT'"
    "'refunded'" = "'CANCELLED'"
    "'in_progress'" = "'CONFIRMED'"
    "'picked_up'" = "'CONFIRMED'"
    "'in_transit'" = "'CONFIRMED'"
    "'late_pickup'" = "'CONFIRMED'"
    "'late_delivery'" = "'CONFIRMED'"
    "'en-route'" = "'CONFIRMED'"
    "'at-pickup'" = "'CONFIRMED'"
    "'at-drop'" = "'CONFIRMED'"
    "'loading'" = "'CONFIRMED'"
    "'delivering'" = "'CONFIRMED'"
    "'en_route_pickup'" = "'CONFIRMED'"
    "'arrived'" = "'CONFIRMED'"
    "'loaded'" = "'CONFIRMED'"
    "'en_route_dropoff'" = "'CONFIRMED'"
    "'on_way'" = "'CONFIRMED'"
}

# Get all TypeScript and TSX files in src directory
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | Where-Object { $_.FullName -notlike "*node_modules*" }

Write-Host "Found $($files.Count) TypeScript files to process"

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)"
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Apply field replacements
    foreach ($pattern in $fieldReplacements.Keys) {
        $replacement = $fieldReplacements[$pattern]
        $content = $content -replace $pattern, $replacement
    }
    
    # Apply relation replacements
    foreach ($pattern in $relationReplacements.Keys) {
        $replacement = $relationReplacements[$pattern]
        $content = $content -replace $pattern, $replacement
    }
    
    # Apply status replacements
    foreach ($pattern in $statusReplacements.Keys) {
        $replacement = $statusReplacements[$pattern]
        $content = $content -replace $pattern, $replacement
    }
    
    # Special case: Fix amountPence calculations
    $content = $content -replace '(\w+)\.totalGBP \/', '($1.totalGBP || 0) * 100 /'
    $content = $content -replace '(\w+)\.totalGBP\)', '($1.totalGBP || 0) * 100)'
    $content = $content -replace 'sum + (\w+)\.totalGBP', 'sum + (($1.totalGBP || 0) * 100)'
    
    # Write back if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Updated $($file.Name)"
    }
}

Write-Host "TypeScript error fixes completed!"
