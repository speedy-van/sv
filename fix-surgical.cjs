/**
 * سكريبت جراحي لإصلاح أخطاء Prisma Relations
 * 
 * يقوم بـ:
 * 1. تصحيح أسماء العلاقات (driver vs Driver)
 * 2. إضافة pickupAddress و dropoffAddress إلى include حيث يتم استخدامها
 */

const fs = require('fs');
const path = require('path');

// القواعد الصحيحة من Schema
const RELATION_RULES = {
  'Booking.driver': 'driver',        // lowercase
  'Assignment.Driver': 'Driver',     // uppercase  
  'Route.driver': 'driver',          // lowercase
  'Route.drops': 'drops',            // lowercase
  'DriverPayout.Driver': 'Driver',   // uppercase
  'DriverIncident.Driver': 'Driver', // uppercase
};

let filesFixed = 0;
let changesApplied = 0;

/**
 * إصلاح ملف واحد
 */
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileChanges = 0;

  // 1. إصلاح DriverIncident.driver -> Driver
  const driverIncidentPattern = /prisma\.driverIncident\.(findMany|findUnique|findFirst)\s*\(\s*\{[^}]*include\s*:\s*\{\s*driver\s*:/gs;
  if (driverIncidentPattern.test(content)) {
    content = content.replace(
      /(prisma\.driverIncident\.(findMany|findUnique|findFirst)\s*\(\s*\{[^}]*include\s*:\s*\{)\s*driver\s*:/gs,
      '$1 Driver:'
    );
    fileChanges++;
    console.log(`  ✓ Fixed DriverIncident.driver -> Driver`);
  }

  // 2. إصلاح Assignment.driver -> Driver
  const assignmentPattern = /prisma\.assignment\.(findMany|findUnique|findFirst)\s*\(\s*\{[^}]*include\s*:\s*\{\s*driver\s*:/gs;
  if (assignmentPattern.test(content)) {
    content = content.replace(
      /(prisma\.assignment\.(findMany|findUnique|findFirst)\s*\(\s*\{[^}]*include\s*:\s*\{)\s*driver\s*:/gs,
      '$1 Driver:'
    );
    fileChanges++;
    console.log(`  ✓ Fixed Assignment.driver -> Driver`);
  }

  // 3. إصلاح Booking.Driver -> driver
  const bookingPattern = /prisma\.booking\.(findMany|findUnique|findFirst)\s*\(\s*\{[^}]*include\s*:\s*\{\s*Driver\s*:/gs;
  if (bookingPattern.test(content)) {
    content = content.replace(
      /(prisma\.booking\.(findMany|findUnique|findFirst)\s*\(\s*\{[^}]*include\s*:\s*\{)\s*Driver\s*:/gs,
      '$1 driver:'
    );
    fileChanges++;
    console.log(`  ✓ Fixed Booking.Driver -> driver`);
  }

  // 4. إضافة pickupAddress و dropoffAddress إلى include حيث يتم استخدامها
  // نبحث عن booking.pickupAddress أو booking.dropoffAddress بدون include مناسب
  const hasPickupUsage = /\bbooking\.pickupAddress\b/.test(content);
  const hasDropoffUsage = /\bbooking\.dropoffAddress\b/.test(content);
  
  if ((hasPickupUsage || hasDropoffUsage)) {
    // نبحث عن prisma.booking.findUnique أو findMany بدون pickupAddress في include
    const bookingQueryPattern = /(prisma\.booking\.(findUnique|findMany|findFirst)\s*\(\s*\{[^}]*include\s*:\s*\{)([^}]*?)(\})/gs;
    
    content = content.replace(bookingQueryPattern, (match, beforeInclude, method, includeContent, afterInclude) => {
      let newInclude = includeContent;
      let added = false;
      
      // إذا لم يحتوي على pickupAddress وتم استخدامه
      if (hasPickupUsage && !/pickupAddress\s*:/.test(includeContent)) {
        if (newInclude.trim() && !newInclude.trim().endsWith(',')) {
          newInclude += ',';
        }
        newInclude += '\n        pickupAddress: true,';
        added = true;
      }
      
      // إذا لم يحتوي على dropoffAddress وتم استخدامه
      if (hasDropoffUsage && !/dropoffAddress\s*:/.test(includeContent)) {
        if (newInclude.trim() && !newInclude.trim().endsWith(',')) {
          newInclude += ',';
        }
        newInclude += '\n        dropoffAddress: true,';
        added = true;
      }
      
      if (added) {
        fileChanges++;
        console.log(`  ✓ Added pickupAddress/dropoffAddress to include`);
      }
      
      return beforeInclude + newInclude + afterInclude;
    });
  }

  // إذا تم إجراء أي تغييرات، نحفظ الملف
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesFixed++;
    changesApplied += fileChanges;
    return true;
  }
  
  return false;
}

/**
 * معالجة جميع ملفات TypeScript في مجلد
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // تجاهل node_modules و .next
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== 'dist') {
        processDirectory(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const changed = fixFile(fullPath);
      if (changed) {
        console.log(`\n📝 Fixed: ${fullPath}`);
      }
    }
  }
}

// تشغيل السكريبت
console.log('🔧 Starting surgical fix for Prisma Relations...\n');
console.log('Rules:');
console.log('  - DriverIncident.driver -> Driver (uppercase)');
console.log('  - Assignment.driver -> Driver (uppercase)');
console.log('  - Booking.Driver -> driver (lowercase)');
console.log('  - Adding pickupAddress/dropoffAddress where used');
console.log('\n');

const srcPath = path.join(__dirname, 'apps', 'web', 'src');
processDirectory(srcPath);

console.log('\n✅ Done!');
console.log(`📊 Fixed ${filesFixed} files with ${changesApplied} changes`);
