const fs = require('fs');
const path = require('path');

// Basic select clause for user queries
const basicUserSelect = `select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },`;

const filesTo Fix = [
  {
    file: 'apps/web/src/app/api/auth/reset/route.ts',
    line: 27,
    pattern: /const user = await prisma\.user\.findFirst\(\{\s*where: \{\s*resetToken: token,\s*resetTokenExpiry: \{\s*gt: new Date\(\),\s*\},\s*\},\s*\}\);/s,
    replacement: `const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        resetToken: true,
        resetTokenExpiry: true,
      },
    });`
  },
  {
    file: 'apps/web/src/app/api/auth/verify-email/route.ts',
    line: 17,
    pattern: /const user = await prisma\.user\.findFirst\(\{\s*where: \{ emailVerificationToken: token \},\s*\}\);/s,
    replacement: `const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
      select: {
        id: true,
        email: true,
        emailVerificationToken: true,
        emailVerificationExpiry: true,
        emailVerified: true,
      },
    });`
  },
  {
    file: 'apps/web/src/app/api/auth/resend-verification/route.ts',
    line: 15,
    pattern: /const user = await prisma\.user\.findFirst\(\{\s*where: \{\s*email: \{ equals: email, mode: 'insensitive' \},\s*\},\s*\}\);/s,
    replacement: `const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });`
  },
  {
    file: 'apps/web/src/app/api/auth/test/route.ts',
    line: 27,
    pattern: /const user = await prisma\.user\.findUnique\(\{\s*where: \{ id: session\.user\.id \},\s*\}\);/s,
    replacement: `const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });`
  },
  {
    file: 'apps/web/src/app/api/customer/auth/login/route.ts',
    line: 19,
    pattern: /const user = await prisma\.user\.findFirst\(\{\s*where: \{\s*email: \{\s*equals: email,\s*mode: 'insensitive',\s*\},\s*role: 'customer',\s*\},\s*\}\);/s,
    replacement: `const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        role: 'customer',
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
      },
    });`
  }
];

console.log(`🔧 Fixing ${filesToFix.length} files...`);

let fixed = 0;
let failed = 0;

filesToFix.forEach(({ file, pattern, replacement }) => {
  const fullPath = path.join(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${file}`);
    failed++;
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  if (pattern.test(content)) {
    content = content.replace(pattern, replacement);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  } else {
    console.log(`⚠️  Pattern not found in: ${file}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${fixed} fixed, ${failed} failed`);
