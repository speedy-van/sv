#!/bin/bash

# Bulk add authentication to admin endpoints

FILES=(
  "analytics/performance/route.ts"
  "cleanup-emails/route.ts"
  "email-security/route.ts"
  "fix-driver-audio/route.ts"
  "metrics/availability/route.ts"
  "orders/[code]/fix-coordinates/route.ts"
  "orders/pending/route.ts"
  "routes/[id]/edit/route.ts"
  "routes/create/route.ts"
  "routes/suggested/route.ts"
  "routing/cron/route.ts"
  "tracking-diagnostics/route.ts"
)

BASE_DIR="apps/web/src/app/api/admin"

for file in "${FILES[@]}"; do
  filepath="$BASE_DIR/$file"
  
  if [ -f "$filepath" ]; then
    echo "Processing: $file"
    
    # Check if already has requireAdminAuth
    if grep -q "requireAdminAuth" "$filepath"; then
      echo "  ✅ Already has auth"
    else
      # Add import if not present
      if ! grep -q "requireAdminAuth" "$filepath"; then
        # Find the line with NextRequest import
        sed -i "/import.*NextRequest.*NextResponse/a import { requireAdminAuth } from '@/lib/api/admin-auth';" "$filepath"
      fi
      
      # Add auth check to GET method
      if grep -q "export async function GET" "$filepath"; then
        sed -i "/export async function GET.*{/a \ \ \/\/ Authentication check\n  const authError = await requireAdminAuth(request);\n  if (authError) return authError;\n" "$filepath"
      fi
      
      # Add auth check to POST method
      if grep -q "export async function POST" "$filepath"; then
        sed -i "/export async function POST.*{/a \ \ \/\/ Authentication check\n  const authError = await requireAdminAuth(request);\n  if (authError) return authError;\n" "$filepath"
      fi
      
      # Add auth check to PUT method
      if grep -q "export async function PUT" "$filepath"; then
        sed -i "/export async function PUT.*{/a \ \ \/\/ Authentication check\n  const authError = await requireAdminAuth(request);\n  if (authError) return authError;\n" "$filepath"
      fi
      
      # Add auth check to DELETE method
      if grep -q "export async function DELETE" "$filepath"; then
        sed -i "/export async function DELETE.*{/a \ \ \/\/ Authentication check\n  const authError = await requireAdminAuth(request);\n  if (authError) return authError;\n" "$filepath"
      fi
      
      echo "  ✅ Added auth"
    fi
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ Done! Fixed authentication for all endpoints."
