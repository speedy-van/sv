#!/usr/bin/env node

/**
 * Script to remove console.log statements from production code
 * Only removes console.log, keeps console.error and console.warn
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import * as path from 'path';

const srcDir = path.join(__dirname, '../src');

function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  function scanDirectory(currentDir: string) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip test directories and node_modules
        if (!item.includes('test') && item !== 'node_modules') {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext) && !item.includes('.test.') && !item.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

async function removeConsoleLogs() {
  console.log('🧹 Removing console.log statements from production code...');
  
  // Find all TypeScript and JavaScript files in src directory
  const files = getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

  let totalReplacements = 0;

  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf8');
      const originalLength = content.length;
      
      // Remove standalone console.log statements (but keep console.error, console.warn, etc.)
      content = content.replace(
        /^(\s*)console\.log\(.*?\);?\s*$/gm,
        ''
      );
      
      // Remove console.log calls in expressions (more careful approach)
      content = content.replace(
        /console\.log\([^)]*\);?\s*/g,
        ''
      );
      
      if (content.length !== originalLength) {
        writeFileSync(file, content);
        const relativePath = path.relative(process.cwd(), file);
        console.log(`✅ Cleaned: ${relativePath}`);
        totalReplacements++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  console.log(`\n🎉 Completed! Processed ${files.length} files, cleaned ${totalReplacements} files.`);
  
  if (totalReplacements > 0) {
    console.log('\n⚠️  Please review the changes and test your application!');
    console.log('💡 Tip: Use console.error for errors and console.warn for warnings in production.');
  }
}

removeConsoleLogs().catch(console.error);