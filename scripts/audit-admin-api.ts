/**
 * Admin API Endpoints Audit Script
 * 
 * Checks all admin API endpoints for:
 * - Correct HTTP methods (GET, POST, PUT, DELETE, PATCH)
 * - Proper error handling
 * - Authentication checks
 * - Return types consistency
 * - Prisma query issues
 * - Missing await keywords
 * - Proper NextResponse usage
 */

import * as fs from 'fs';
import * as path from 'path';

interface EndpointIssue {
  file: string;
  line: number;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  code?: string;
}

interface EndpointInfo {
  file: string;
  methods: string[];
  hasAuth: boolean;
  hasPrisma: boolean;
  hasErrorHandling: boolean;
  issues: EndpointIssue[];
}

const ADMIN_API_DIR = path.join(process.cwd(), 'apps/web/src/app/api/admin');
const results: Map<string, EndpointInfo> = new Map();

// Patterns to check
const PATTERNS = {
  httpMethods: /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g,
  authCheck: /(getServerSession|requireAdmin|checkAuth|verifyToken|withApiHandler|requireRole|requireAuth)/,
  prismaQuery: /prisma\.(.*?)\.(findMany|findUnique|findFirst|create|update|delete|upsert|count)/g,
  missingAwait: /prisma\.(.*?)\.(findMany|findUnique|findFirst|create|update|delete|upsert|count)(?!\s*\))/,
  errorHandling: /try\s*{|catch\s*\(/,
  nextResponse: /NextResponse\.(json|redirect)/,
  driverSelect: /driver:\s*{\s*select:\s*{\s*User:/,
  driverNameAccess: /driver\.name|driver\.email/,
  userIdVsDriverId: /route\.driverId\s*(!==|===)\s*driver\.id/,
};

function scanFile(filePath: string): EndpointInfo {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(ADMIN_API_DIR, filePath);
  
  const info: EndpointInfo = {
    file: relativePath,
    methods: [],
    hasAuth: false,
    hasPrisma: false,
    hasErrorHandling: false,
    issues: [],
  };

  // Check HTTP methods
  const methodMatches = content.matchAll(PATTERNS.httpMethods);
  for (const match of methodMatches) {
    if (match[1]) {
      info.methods.push(match[1]);
    }
  }

  // Check authentication
  info.hasAuth = PATTERNS.authCheck.test(content);
  if (!info.hasAuth && !relativePath.includes('/health')) {
    info.issues.push({
      file: relativePath,
      line: 1,
      severity: 'critical',
      category: 'Security',
      message: 'Missing authentication check',
    });
  }

  // Check Prisma usage
  info.hasPrisma = /prisma\./.test(content);

  // Check error handling
  info.hasErrorHandling = PATTERNS.errorHandling.test(content);
  if (info.methods.length > 0 && !info.hasErrorHandling) {
    info.issues.push({
      file: relativePath,
      line: 1,
      severity: 'warning',
      category: 'Error Handling',
      message: 'Missing try-catch block',
    });
  }

  // Check for Prisma query issues
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for incorrect driver.User select pattern
    if (PATTERNS.driverSelect.test(line)) {
      info.issues.push({
        file: relativePath,
        line: lineNum,
        severity: 'critical',
        category: 'Prisma Query',
        message: 'Incorrect driver select - driver is User, not Driver model',
        code: line.trim(),
      });
    }

    // Check for incorrect driver.name or driver.email access
    if (PATTERNS.driverNameAccess.test(line) && !line.includes('//')) {
      // Check if this is in a select statement (which is correct)
      if (!line.includes('select:') && !line.includes('driver: {')) {
        info.issues.push({
          file: relativePath,
          line: lineNum,
          severity: 'warning',
          category: 'Prisma Query',
          message: 'Accessing driver.name/email - ensure driver relation is included',
          code: line.trim(),
        });
      }
    }

    // Check for userId vs driver.id confusion
    if (PATTERNS.userIdVsDriverId.test(line)) {
      info.issues.push({
        file: relativePath,
        line: lineNum,
        severity: 'critical',
        category: 'Prisma Query',
        message: 'Comparing route.driverId with driver.id - should use userId',
        code: line.trim(),
      });
    }

    // Check for missing await on Prisma queries
    if (line.includes('prisma.') && !line.includes('await') && !line.includes('//')) {
      const prismaMatch = line.match(/prisma\.(.*?)\.(findMany|findUnique|findFirst|create|update|delete|upsert|count)/);
      if (prismaMatch) {
        info.issues.push({
          file: relativePath,
          line: lineNum,
          severity: 'critical',
          category: 'Async/Await',
          message: `Missing await on prisma.${prismaMatch[1]}.${prismaMatch[2]}()`,
          code: line.trim(),
        });
      }
    }

    // Check for NextResponse usage
    if (line.includes('return') && !line.includes('NextResponse') && !line.includes('//')) {
      if (line.includes('json(') || line.includes('Response(')) {
        info.issues.push({
          file: relativePath,
          line: lineNum,
          severity: 'warning',
          category: 'Response',
          message: 'Should use NextResponse.json() instead of Response()',
          code: line.trim(),
        });
      }
    }
  });

  return info;
}

function scanDirectory(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.name === 'route.ts') {
      const info = scanFile(fullPath);
      results.set(fullPath, info);
    }
  }
}

function generateReport(): string {
  let report = '# Admin API Endpoints Audit Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `**Total Endpoints:** ${results.size}\n\n`;

  // Summary
  const totalIssues = Array.from(results.values()).reduce((sum, info) => sum + info.issues.length, 0);
  const criticalIssues = Array.from(results.values()).reduce(
    (sum, info) => sum + info.issues.filter(i => i.severity === 'critical').length,
    0
  );
  const warningIssues = Array.from(results.values()).reduce(
    (sum, info) => sum + info.issues.filter(i => i.severity === 'warning').length,
    0
  );

  report += '## Summary\n\n';
  report += `- **Total Issues:** ${totalIssues}\n`;
  report += `- **Critical:** ${criticalIssues} 🔴\n`;
  report += `- **Warnings:** ${warningIssues} ⚠️\n`;
  report += `- **Info:** ${totalIssues - criticalIssues - warningIssues} ℹ️\n\n`;

  // Issues by category
  const issuesByCategory = new Map<string, EndpointIssue[]>();
  for (const info of results.values()) {
    for (const issue of info.issues) {
      if (!issuesByCategory.has(issue.category)) {
        issuesByCategory.set(issue.category, []);
      }
      issuesByCategory.get(issue.category)!.push(issue);
    }
  }

  report += '## Issues by Category\n\n';
  for (const [category, issues] of issuesByCategory.entries()) {
    report += `### ${category} (${issues.length})\n\n`;
    
    // Group by severity
    const critical = issues.filter(i => i.severity === 'critical');
    const warnings = issues.filter(i => i.severity === 'warning');
    const info = issues.filter(i => i.severity === 'info');

    if (critical.length > 0) {
      report += '#### 🔴 Critical\n\n';
      for (const issue of critical) {
        report += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
        if (issue.code) {
          report += `  \`\`\`typescript\n  ${issue.code}\n  \`\`\`\n`;
        }
      }
      report += '\n';
    }

    if (warnings.length > 0) {
      report += '#### ⚠️ Warnings\n\n';
      for (const issue of warnings) {
        report += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
        if (issue.code) {
          report += `  \`\`\`typescript\n  ${issue.code}\n  \`\`\`\n`;
        }
      }
      report += '\n';
    }
  }

  // Endpoints without issues
  const cleanEndpoints = Array.from(results.values()).filter(info => info.issues.length === 0);
  report += `## ✅ Clean Endpoints (${cleanEndpoints.length})\n\n`;
  for (const info of cleanEndpoints) {
    report += `- ${info.file} (${info.methods.join(', ')})\n`;
  }
  report += '\n';

  // Endpoints with issues
  const problematicEndpoints = Array.from(results.values()).filter(info => info.issues.length > 0);
  report += `## ❌ Endpoints with Issues (${problematicEndpoints.length})\n\n`;
  for (const info of problematicEndpoints.sort((a, b) => b.issues.length - a.issues.length)) {
    report += `### ${info.file}\n\n`;
    report += `- **Methods:** ${info.methods.join(', ')}\n`;
    report += `- **Issues:** ${info.issues.length}\n`;
    report += `- **Auth:** ${info.hasAuth ? '✅' : '❌'}\n`;
    report += `- **Error Handling:** ${info.hasErrorHandling ? '✅' : '❌'}\n\n`;
    
    for (const issue of info.issues) {
      const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      report += `${icon} **Line ${issue.line}:** ${issue.message}\n`;
      if (issue.code) {
        report += `\`\`\`typescript\n${issue.code}\n\`\`\`\n`;
      }
    }
    report += '\n';
  }

  return report;
}

// Run the audit
console.log('🔍 Starting Admin API Endpoints Audit...\n');
scanDirectory(ADMIN_API_DIR);

const report = generateReport();
const reportPath = path.join(process.cwd(), 'ADMIN_API_AUDIT_REPORT.md');
fs.writeFileSync(reportPath, report);

console.log(`✅ Audit complete!`);
console.log(`📄 Report saved to: ${reportPath}\n`);

// Print summary to console
const totalIssues = Array.from(results.values()).reduce((sum, info) => sum + info.issues.length, 0);
const criticalIssues = Array.from(results.values()).reduce(
  (sum, info) => sum + info.issues.filter(i => i.severity === 'critical').length,
  0
);

console.log(`Total Endpoints: ${results.size}`);
console.log(`Total Issues: ${totalIssues}`);
console.log(`Critical Issues: ${criticalIssues} 🔴`);

if (criticalIssues > 0) {
  console.log('\n⚠️  Critical issues found! Please review the report.');
  process.exit(1);
} else {
  console.log('\n✅ No critical issues found!');
  process.exit(0);
}

