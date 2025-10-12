#!/usr/bin/env tsx
import fs from 'node:fs/promises';
import path from 'node:path';

interface Violation {
  file: string;
  line: number;
  type:
    | 'edge-runtime'
    | 'force-dynamic'
    | 'no-store-cache'
    | 'preferred-region'
    | 'next-server-import'
    | 'next-navigation-import';
  content: string;
}

async function scanFile(filePath: string): Promise<Violation[]> {
  const violations: Violation[] = [];
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip client components
  const isClientComponent =
    content.includes("'use client'") || content.includes('"use client"');
  if (isClientComponent) {
    return violations; // Client components can use next/navigation freely
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check for edge runtime in non-API files
    if (line.includes('export const runtime') && line.includes('edge')) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: 'edge-runtime',
        content: line.trim(),
      });
    }

    // Check for force-dynamic in non-API files
    if (
      line.includes('export const dynamic') &&
      line.includes('force-dynamic')
    ) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: 'force-dynamic',
        content: line.trim(),
      });
    }

    // Check for no-store cache in non-API files
    if (line.includes('cache:') && line.includes('no-store')) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: 'no-store-cache',
        content: line.trim(),
      });
    }

    // Check for preferredRegion or regions exports
    if (
      line.includes('export const preferredRegion') ||
      line.includes('export const regions')
    ) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: 'preferred-region',
        content: line.trim(),
      });
    }

    // Check for next/server imports in non-API files (could force edge)
    if (line.includes('import') && line.includes('next/server')) {
      violations.push({
        file: filePath,
        line: lineNum,
        type: 'next-server-import',
        content: line.trim(),
      });
    }
  }

  return violations;
}

async function scanDirectory(
  dir: string,
  excludePatterns: string[]
): Promise<Violation[]> {
  const violations: Violation[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip excluded patterns
      if (excludePatterns.some(pattern => fullPath.includes(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        violations.push(...(await scanDirectory(fullPath, excludePatterns)));
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        // Only scan page, layout, and metadata files
        if (
          entry.name.includes('page') ||
          entry.name.includes('layout') ||
          entry.name.includes('opengraph') ||
          entry.name.includes('icon') ||
          entry.name.includes('manifest') ||
          entry.name.includes('robots') ||
          entry.name.includes('sitemap') ||
          (entry.name.includes('route') && !fullPath.includes('/api/'))
        ) {
          violations.push(...(await scanFile(fullPath)));
        }
      }
    }
  } catch (error) {
    // Skip directories we can't access
  }

  return violations;
}

async function main() {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const excludePatterns = ['/api/', 'middleware.ts'];

  console.log('🔍 Scanning for edge runtime violations in public pages...');

  const violations = await scanDirectory(appDir, excludePatterns);

  if (violations.length === 0) {
    console.log('✅ No edge runtime violations found in public pages!');
    return;
  }

  console.error('❌ Found edge runtime violations in public pages:');
  console.error('');

  for (const violation of violations) {
    const relativePath = path.relative(process.cwd(), violation.file);
    console.error(`  ${relativePath}:${violation.line}`);
    console.error(`    ${violation.type}: ${violation.content}`);
    console.error('');
  }

  console.error('💡 Fix these violations by:');
  console.error("   - Setting runtime = 'nodejs' for pages/layouts");
  console.error("   - Setting dynamic = 'force-static' for pages");
  console.error(
    "   - Using next: { revalidate: 86400 } instead of cache: 'no-store'"
  );
  console.error(
    '   - Removing preferredRegion/regions exports from pages/layouts'
  );
  console.error(
    '   - Moving next/server and next/navigation imports to client components or API routes'
  );
  console.error('');

  process.exit(1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Guard script failed:', error);
    process.exit(1);
  });
}
