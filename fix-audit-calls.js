#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findFiles(dir, pattern, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findFiles(fullPath, pattern, files);
    } else if (pattern.test(item)) {
      files.push(fullPath);
    }
  }
  return files;
}

function fixCreateAuditLog(content) {
  // Replace: await createAuditLog({ action: '...', targetType: '...', targetId: '...', ... })
  // With: await createAuditLog(user.id, '...', '...', { targetType: '...', ... })
  return content.replace(
    /await createAuditLog\(\s*{\s*action:\s*['"]([^'"]*)['"],\s*targetType:\s*['"]([^'"]*)['"],\s*targetId:\s*([^,]+),\s*([^}]*)\s*}\s*\)/g,
    'await createAuditLog(user.id, \'$1\', $3, { targetType: \'$2\', $4 })'
  );
}

const files = findFiles('apps/web/src', /\.ts$/);
let fixed = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('await createAuditLog({')) {
    const newContent = fixCreateAuditLog(content);
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log('Fixed:', file);
      fixed++;
    }
  }
}
console.log('Total files fixed:', fixed);