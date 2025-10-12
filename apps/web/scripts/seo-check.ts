#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Starting SEO and build integrity checks...\n');

try {
  // 1. Check if build directory exists
  const buildDir = join(process.cwd(), '.next');
  if (!existsSync(buildDir)) {
    throw new Error(
      '❌ Build directory (.next) not found. Run "npm run build" first.'
    );
  }

  // 2. Check if static files exist
  const staticDir = join(buildDir, 'static');
  if (!existsSync(staticDir)) {
    throw new Error('❌ Static files not found in build directory.');
  }

  // 3. Check if HTML files exist
  const htmlDir = join(buildDir, 'server', 'pages');
  if (!existsSync(htmlDir)) {
    throw new Error('❌ HTML files not found in build directory.');
  }

  // 4. Check package.json for required meta fields
  const packageJson = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf8')
  );

  if (!packageJson.name) {
    console.warn('⚠️  Warning: package.json missing "name" field');
  }

  if (!packageJson.version) {
    console.warn('⚠️  Warning: package.json missing "version" field');
  }

  // 5. Check if public/manifest.json exists
  const manifestPath = join(process.cwd(), 'public', 'manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (!manifest.name || !manifest.short_name) {
      console.warn('⚠️  Warning: manifest.json missing required fields');
    }
  } else {
    console.warn('⚠️  Warning: public/manifest.json not found');
  }

  // 6. Check if robots.txt exists
  const robotsPath = join(process.cwd(), 'public', 'robots.txt');
  if (!existsSync(robotsPath)) {
    console.warn('⚠️  Warning: public/robots.txt not found');
  }

  // 7. Check if sitemap exists
  const sitemapPath = join(process.cwd(), 'public', 'sitemap.xml');
  if (!existsSync(sitemapPath)) {
    console.warn('⚠️  Warning: public/sitemap.xml not found');
  }

  console.log('✅ Build integrity check passed');
  console.log('✅ Static files generated successfully');
  console.log('✅ HTML files generated successfully');
  console.log('\n🎯 SEO check completed successfully!');

  process.exit(0);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('❌ SEO check failed:', errorMessage);
  process.exit(1);
}
