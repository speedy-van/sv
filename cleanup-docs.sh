#!/bin/bash

# Documentation Cleanup Script
# Removes duplicate and outdated documentation files
# Keeps only essential documentation

echo "🧹 Starting documentation cleanup..."

# Create archive directory for old docs
mkdir -p .archive/old-docs

# Essential files to KEEP (will NOT be moved)
KEEP_FILES=(
  "README.md"
  "TECHNICAL_REPORT.md"
  "GOOGLE_ADS_PLAN.md"
  "ENTERPRISE_SEO_STRATEGY.md"
  "FINAL_IMPLEMENTATION_REPORT.md"
  "REQUIREMENTS_CHECKLIST.md"
  "PRODUCTION_CHECKLIST.md"
  "QUICK_START.md"
  "TESTING_GUIDE.md"
  "DEPLOYMENT_GUIDE.md"
)

# Move all .md files to archive except essential ones
for file in *.md; do
  # Skip if file doesn't exist
  [ -e "$file" ] || continue
  
  # Check if file is in KEEP list
  KEEP=false
  for keep_file in "${KEEP_FILES[@]}"; do
    if [ "$file" = "$keep_file" ]; then
      KEEP=true
      break
    fi
  done
  
  # Move to archive if not in KEEP list
  if [ "$KEEP" = false ]; then
    echo "📦 Archiving: $file"
    mv "$file" .archive/old-docs/
  else
    echo "✅ Keeping: $file"
  fi
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Kept: ${#KEEP_FILES[@]} essential files"
echo "  - Archived: $(ls -1 .archive/old-docs/*.md 2>/dev/null | wc -l) old files"
echo ""
echo "📁 Archived files are in: .archive/old-docs/"

