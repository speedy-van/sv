/**
 * Fix Admin API Authentication
 * 
 * Adds authentication checks to admin endpoints that are missing them
 */

import * as fs from 'fs';
import * as path from 'path';

const ADMIN_API_DIR = path.join(process.cwd(), 'apps/web/src/app/api/admin');

const AUTH_IMPORT = `import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';`;

const AUTH_CHECK = `
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
`;

const FILES_TO_FIX = [
  'analytics/performance/route.ts',
  'cleanup-emails/route.ts',
  'customers/[id]/route.ts',
  'customers/route.ts',
  'dashboard/route.ts',
  'email-security/route.ts',
  'fix-driver-audio/route.ts',
  'metrics/availability/route.ts',
  'orders/[code]/fix-coordinates/route.ts',
  'orders/[code]/tracking/route.ts',
  'orders/pending/route.ts',
  'routes/[id]/edit/route.ts',
  'routes/active/route.ts',
  'routes/create/route.ts',
  'routes/suggested/route.ts',
  'routing/cron/route.ts',
  'search/route.ts',
  'tracking-diagnostics/route.ts',
  'users/route.ts',
];

function addAuthCheck(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if already has auth
    if (content.includes('getServerSession') || content.includes('requireAdmin')) {
      console.log(`✅ ${path.basename(path.dirname(filePath))}/${path.basename(filePath)} - Already has auth`);
      return false;
    }

    // Add import if not present
    if (!content.includes('getServerSession')) {
      // Find the last import statement
      const importRegex = /import .* from .*;/g;
      const imports = content.match(importRegex);
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        content = content.replace(lastImport, `${lastImport}\n${AUTH_IMPORT}`);
      }
    }

    // Add auth check to each HTTP method
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    let modified = false;

    for (const method of methods) {
      const methodRegex = new RegExp(`export async function ${method}\\s*\\([^)]*\\)\\s*{`, 'g');
      const match = methodRegex.exec(content);
      
      if (match) {
        const insertPos = match.index + match[0].length;
        content = content.slice(0, insertPos) + AUTH_CHECK + content.slice(insertPos);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
    return false;
  }
}

console.log('🔧 Adding authentication checks to admin endpoints...\n');

let fixedCount = 0;
for (const file of FILES_TO_FIX) {
  const filePath = path.join(ADMIN_API_DIR, file);
  if (fs.existsSync(filePath)) {
    if (addAuthCheck(filePath)) {
      fixedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);

