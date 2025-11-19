// Fix remaining Prisma type errors by adding type assertions
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const patterns = [
  // Fix pickupAddress/dropoffAddress in includes - remove them
  {
    from: /include:\s*\{([^}]*)\bpickupAddress\s*:\s*true\s*,?\s*/g,
    to: 'include: {$1',
    desc: 'Remove pickupAddress from includes'
  },
  {
    from: /include:\s*\{([^}]*)\bdropoffAddress\s*:\s*true\s*,?\s*/g,
    to: 'include: {$1',
    desc: 'Remove dropoffAddress from includes'
  },
  // Fix Booking.driver -> Booking.Driver  
  {
    from: /(\bBooking\w*\.findMany|findUnique|findFirst)\(([^)]*?)include:\s*\{([^}]*?)\bdriver\s*:/g,
    to: '$1($2include: {$3Driver:',
    desc: 'Booking.driver -> Booking.Driver in includes'
  },
  // Fix create operations - add as any
  {
    from: /await\s+prisma\.(\w+)\.create\(\s*\{/g,
    to: 'await prisma.$1.create({',
    desc: 'Keep create operations as-is'
  }
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const original = content;

  for (const { from, to, desc } of patterns) {
    const matches = content.match(from);
    if (matches && matches.length > 0) {
      content = content.replace(from, to);
      if (content !== original) {
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.next') && !filePath.includes('__tests__')) {
        fixedCount += walkDir(filePath);
      }
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.test.ts') && !file.endsWith('.test.tsx')) {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

console.log('Fixing remaining type errors...\n');
const fixed = walkDir(srcDir);
console.log(`\n✓ Fixed ${fixed} files`);
