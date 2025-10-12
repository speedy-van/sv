#!/usr/bin/env node

/**
 * Script to fix authentication patterns in API routes
 * This script fixes the auth destructuring and session references
 * after changing requireAdmin to return user object directly
 */

const fs = require('fs');
const path = require('path');

// Recursively find all TypeScript files in API routes
function findApiFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findApiFiles(fullPath, files);
    } else if (item.endsWith('.ts') && fullPath.includes('api')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Fix auth destructuring pattern
function fixAuthDestructuring(content) {
  // Replace: const { user, session } = authResult;
  // With: const user = authResult;
  return content.replace(
    /const\s*{\s*user\s*,\s*session\s*}\s*=\s*authResult\s*;/g,
    'const user = authResult;'
  );
}

// Fix session.user references
function fixSessionReferences(content) {
  // Replace session.user.id with user.id
  content = content.replace(/session\.user\.id/g, 'user.id');

  // Replace session.user.email with user.email
  content = content.replace(/session\.user\.email/g, 'user.email');

  // Replace other session.user properties if any
  content = content.replace(/session\.user\.([a-zA-Z_][a-zA-Z0-9_]*)/g, 'user.$1');

  return content;
}

// Fix createAuditLog calls that use object syntax
function fixCreateAuditLog(content) {
  // This is more complex, but let's try to fix common patterns
  // Replace: createAuditLog({ action: '...', targetType: '...', targetId: '...', after: {...} })
  // With: createAuditLog(userId, 'action', 'targetId', details)

  // First, find all createAuditLog calls with object syntax
  const createAuditLogRegex = /createAuditLog\(\s*{\s*([^}]+)\s*}\s*\)/g;

  return content.replace(createAuditLogRegex, (match, objContent) => {
    // Parse the object content
    const props = {};
    const propRegex = /(\w+)\s*:\s*([^,]+),?/g;
    let propMatch;
    while ((propMatch = propRegex.exec(objContent)) !== null) {
      props[propMatch[1]] = propMatch[2].trim();
    }

    // Extract values
    const action = props.action?.replace(/['"]/g, '') || 'unknown';
    const targetId = props.targetId || props.targetID || 'null';
    const details = props.after || props.details || '{}';

    // Return the new format
    return `createAuditLog(user.id, '${action}', ${targetId}, ${details})`;
  });
}

async function processFile(filePath) {
  console.log(`Processing: ${filePath}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if file contains requireAdmin
    if (!content.includes('requireAdmin')) {
      console.log(`  Skipping: ${filePath} (no requireAdmin)`);
      return;
    }

    const originalContent = content;

    // Apply fixes
    content = fixAuthDestructuring(content);
    content = fixSessionReferences(content);
    content = fixCreateAuditLog(content);

    // Only write if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  Fixed: ${filePath}`);
    } else {
      console.log(`  No changes: ${filePath}`);
    }

  } catch (error) {
    console.error(`  Error processing ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('Starting auth pattern fixes...');

  const apiDir = path.join(process.cwd(), 'apps/web/src/app/api');
  const files = findApiFiles(apiDir);
  console.log(`Found ${files.length} API files to check`);

  for (const file of files) {
    await processFile(file);
  }

  console.log('Auth pattern fixes completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixAuthDestructuring, fixSessionReferences, fixCreateAuditLog };