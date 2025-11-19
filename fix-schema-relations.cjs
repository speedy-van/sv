const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Prisma schema relation names...\n');

// Key rules:
// 1. Booking.driver = lowercase
// 2. Assignment.Driver = uppercase  
// 3. Route.drops = lowercase
// 4. Route.driver = lowercase

const fixes = [
  // Fix Booking.driver (lowercase)
  {
    pattern: /(include\s*:\s*\{[^}]*?)Driver\s*:\s*(\{[^}]*User\s*:)/g,
    replacement: '$1driver: $2',
    condition: (content, matchIndex) => {
      const before = content.substring(Math.max(0, matchIndex - 500), matchIndex);
      return (before.includes('prisma.booking') || before.includes('Booking:')) &&
             !before.includes('prisma.driverPayout') && !before.includes('DriverPayout:');
    },
    description: 'Booking.driver (lowercase)'
  },
  
  // Fix Assignment.Driver (uppercase)
  {
    pattern: /(Assignment\s*:\s*\{[^}]*include\s*:\s*\{[^}]*?)driver\s*:\s*(\{[^}]*User\s*:)/g,
    replacement: '$1Driver: $2',
    condition: () => true,
    description: 'Assignment.Driver (uppercase)'
  },
  
  // Fix Route.drops (lowercase)
  {
    pattern: /(include\s*:\s*\{[^}]*?)Drop\s*:\s*true/g,
    replacement: '$1drops: true',
    condition: (content, matchIndex) => {
      const before = content.substring(Math.max(0, matchIndex - 300), matchIndex);
      return before.includes('prisma.route');
    },
    description: 'Route.drops (lowercase)'
  },
  
  // Fix Route.driver (lowercase)
  {
    pattern: /(include\s*:\s*\{[^}]*?)User\s*:\s*(\{[^}]*select\s*:\s*\{[^}]*id\s*:)/g,
    replacement: '$1driver: $2',
    condition: (content, matchIndex) => {
      const before = content.substring(Math.max(0, matchIndex - 300), matchIndex);
      return before.includes('prisma.route');
    },
    description: 'Route.driver (lowercase)'
  }
];

function findTsFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && 
            !file.includes('node_modules') && 
            !file.includes('.next') &&
            !file.includes('dist')) {
          findTsFiles(filePath, fileList);
        } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && 
                   !file.includes('.test.') &&
                   !file.includes('.spec.')) {
          fileList.push(filePath);
        }
      } catch (e) {
        // Skip
      }
    });
  } catch (e) {
    // Skip
  }
  return fileList;
}

const srcDir = path.join(__dirname, 'apps/web/src');
const files = findTsFiles(srcDir);

let totalFixed = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const fileFixes = [];

  fixes.forEach(fix => {
    let match;
    const pattern = new RegExp(fix.pattern.source, fix.pattern.flags);
    
    while ((match = pattern.exec(content)) !== null) {
      if (fix.condition(content, match.index)) {
        content = content.substring(0, match.index) + 
                  match[0].replace(fix.pattern, fix.replacement) + 
                  content.substring(match.index + match[0].length);
        fileFixes.push(fix.description);
        break; // Fix one per file per pattern
      }
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log(`✅ ${path.relative(__dirname, filePath)}`);
    fileFixes.forEach(f => console.log(`   - Fixed: ${f}`));
  }
});

console.log(`\n✨ Done! Fixed ${totalFixed} files.`);
