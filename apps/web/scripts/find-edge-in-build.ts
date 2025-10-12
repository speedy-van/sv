#!/usr/bin/env tsx
import fs from 'node:fs/promises';
import path from 'node:path';

async function checkMiddlewareManifest() {
  const manifestPath = '.next/server/middleware-manifest.json';

  try {
    if (
      await fs
        .access(manifestPath)
        .then(() => true)
        .catch(() => false)
    ) {
      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);

      console.log('🔍 Checking middleware-manifest.json...');

      // Check for edge functions
      if (manifest.functions) {
        const edgeFunctions = Object.entries(manifest.functions)
          .filter(([_, config]: [string, any]) => config.runtime === 'edge')
          .map(([name, _]) => name);

        if (edgeFunctions.length > 0) {
          console.log('❌ Found edge functions in middleware manifest:');
          edgeFunctions.forEach(fn => console.log(`   • ${fn}`));
        } else {
          console.log('✅ No edge functions found in middleware manifest');
        }
      }

      // Check for edge SSR
      if (manifest.pages) {
        const edgePages = Object.entries(manifest.pages)
          .filter(([_, config]: [string, any]) => config.runtime === 'edge')
          .map(([name, _]) => name);

        if (edgePages.length > 0) {
          console.log('❌ Found edge SSR pages in middleware manifest:');
          edgePages.forEach(page => console.log(`   • ${page}`));
        } else {
          console.log('✅ No edge SSR pages found in middleware manifest');
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('⚠️  Could not read middleware-manifest.json:', errorMessage);
  }
}

async function scanCompiledFiles() {
  const appDir = '.next/server/app';

  try {
    if (
      !(await fs
        .access(appDir)
        .then(() => true)
        .catch(() => false))
    ) {
      console.log('⚠️  .next/server/app directory not found - run build first');
      return;
    }

    console.log('\n🔍 Scanning compiled app files for edge runtime...');

    const edgeFiles: string[] = [];

    async function scanDirectory(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
          try {
            const content = await fs.readFile(fullPath, 'utf-8');

            // Check for edge runtime indicators
            if (
              content.includes('edge-runtime') ||
              content.includes("runtime: 'edge'") ||
              content.includes('runtime: "edge"')
            ) {
              const relativePath = path.relative('.next/server', fullPath);
              edgeFiles.push(relativePath);
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }

    await scanDirectory(appDir);

    if (edgeFiles.length > 0) {
      console.log('❌ Found compiled files with edge runtime indicators:');
      edgeFiles.forEach(file => console.log(`   • ${file}`));
    } else {
      console.log('✅ No edge runtime indicators found in compiled files');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('⚠️  Error scanning compiled files:', errorMessage);
  }
}

async function main() {
  console.log('🔍 Inspecting build artifacts for edge runtime usage...\n');

  await checkMiddlewareManifest();
  await scanCompiledFiles();

  console.log('\n🎯 Edge runtime inspection complete!');
}

main().catch(console.error);
