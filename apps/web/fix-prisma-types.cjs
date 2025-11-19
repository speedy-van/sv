// Fix common Prisma TypeScript errors
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Fix User includes: driver -> Driver
  {
    from: /include:\s*\{\s*driver:\s*true/g,
    to: 'include: { Driver: true',
    description: 'User.driver -> User.Driver in includes'
  },
  // Fix Route includes: drops -> Drop
  {
    from: /include:\s*\{\s*drops:\s*true/g,
    to: 'include: { Drop: true',
    description: 'Route.drops -> Route.Drop in includes'
  },
  // Fix Booking includes: customer -> removed (use customerId)
  {
    from: /include:\s*\{\s*customer:\s*true[,\s]*\}/g,
    to: 'include: {}',
    description: 'Remove Booking.customer includes'
  },
  // Fix Quote includes: customer -> removed
  {
    from: /(\bQuote\b[\s\S]{0,50})include:\s*\{\s*customer:\s*true/g,
    to: '$1include: {',
    description: 'Remove Quote.customer includes'
  },
  // Fix Route where: drops -> Drop
  {
    from: /where:\s*\{\s*drops:\s*\{/g,
    to: 'where: { Drop: {',
    description: 'Route where drops -> Drop'
  },
  // Fix User includes: customerProfile -> CustomerProfile  
  {
    from: /include:\s*\{\s*customerProfile:\s*true/g,
    to: 'include: { CustomerProfile: true',
    description: 'User.customerProfile -> User.CustomerProfile'
  }
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const { from, to, description } of replacements) {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      console.log(`✓ ${path.relative(srcDir, filePath)}: ${description}`);
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
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
      if (!filePath.includes('node_modules') && !filePath.includes('.next')) {
        fixedCount += walkDir(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

console.log('Starting fixes...\n');
const fixed = walkDir(srcDir);
console.log(`\n✓ Fixed ${fixed} files`);
