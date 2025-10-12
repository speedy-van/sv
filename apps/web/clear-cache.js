#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing Next.js cache...');

// Remove .next directory
const nextDir = path.join(__dirname, '.next');
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('✅ Removed .next directory');
}

// Remove node_modules/.cache
const cacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ Removed node_modules/.cache');
}

// Remove pnpm store cache if exists
const pnpmCacheDir = path.join(__dirname, 'node_modules', '.pnpm');
if (fs.existsSync(pnpmCacheDir)) {
  fs.rmSync(pnpmCacheDir, { recursive: true, force: true });
  console.log('✅ Removed pnpm cache');
}

console.log('🎉 Cache cleared successfully!');
console.log('💡 You can now restart your development server with: pnpm dev');
