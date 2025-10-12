import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { glob } from 'glob';

// Helper function to replace glob functionality
function findFiles(pattern: string, options: { cwd: string; ignore?: string[] }): string[] {
  const files: string[] = [];
  
  function scanDirectory(dir: string, relativePath = ''): void {
    try {
      const entries = readdirSync(join(options.cwd, dir));
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const fullAbsolutePath = join(options.cwd, fullPath);
        const relativeFullPath = join(relativePath, entry);
        
        // Check ignore patterns
        if (options.ignore?.some(ignore => 
          fullPath.includes(ignore.replace('/**', '')) || 
          relativeFullPath.includes(ignore.replace('/**', ''))
        )) {
          continue;
        }
        
        if (statSync(fullAbsolutePath).isDirectory()) {
          scanDirectory(fullPath, relativeFullPath);
        } else {
          // Match pattern
          if (matchesPattern(entry, pattern)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  scanDirectory('');
  return files;
}

function matchesPattern(filename: string, pattern: string): boolean {
  // Simple pattern matching for common cases
  if (pattern.includes('**/*.')) {
    const extensions = pattern.split('**/*.')[1];
    if (extensions.includes('{') && extensions.includes('}')) {
      const exts = extensions.slice(1, -1).split(',');
      return exts.some(ext => filename.endsWith('.' + ext));
    }
    return filename.endsWith('.' + extensions);
  }
  
  if (pattern.includes('**/')) {
    const suffix = pattern.split('**/')[1];
    return filename.includes(suffix.replace('*', ''));
  }
  
  if (pattern.includes('.env')) {
    return filename.includes('.env');
  }
  
  return filename.includes(pattern.replace('*', ''));
}

interface SecurityVulnerability {
  type: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  solution: string;
  impact: string;
}

interface SecurityScanResult {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
}

export class MultiDropSecurityScanner {
  private vulnerabilities: SecurityVulnerability[] = [];
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
  }

  async performComprehensiveScan(): Promise<SecurityScanResult> {
    console.log('🔍 Starting comprehensive security scan...\n');
    
    // Reset vulnerabilities
    this.vulnerabilities = [];

    // Perform all security checks
    await this.scanCredentialsExposure();
    await this.scanAuthenticationSecurity();
    await this.scanInputValidation();
    await this.scanSQLInjectionRisks();
    await this.scanXSSVulnerabilities();
    await this.scanCSRFProtection();
    await this.scanSessionSecurity();
    await this.scanAPIEndpointSecurity();
    await this.scanFileUploadSecurity();
    await this.scanDependencyVulnerabilities();
    await this.scanHTTPSConfiguration();
    await this.scanCORSConfiguration();
    await this.scanRateLimiting();
    await this.scanDataEncryption();
    await this.scanLoggingSecurity();

    return this.generateReport();
  }

  private async scanCredentialsExposure(): Promise<void> {
    console.log('🔐 Scanning for credential exposure...');

    // Check .env files exposure
    const envFiles = findFiles('**/.env*', { 
      cwd: this.basePath,
      ignore: ['node_modules/**', '.git/**']
    });

    for (const envFile of envFiles) {
      const fullPath = join(this.basePath, envFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        
        // Check for hardcoded secrets
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          // Check for exposed secrets
          if (line.includes('SECRET=') && !line.includes('CHANGEME') && line.includes('=')) {
            const value = line.split('=')[1];
            if (value && value.length > 10 && !value.startsWith('${')) {
              this.addVulnerability({
                type: 'high',
                category: 'Credential Exposure',
                title: 'Hardcoded Secret in Environment File',
                description: `Secret value found in ${envFile} at line ${index + 1}`,
                file: envFile,
                line: index + 1,
                solution: 'Use environment variable injection or secure secret management',
                impact: 'Exposed secrets can lead to system compromise'
              });
            }
          }

          // Check for database passwords
          if (line.includes('DATABASE_URL=') && line.includes('password')) {
            this.addVulnerability({
              type: 'medium',
              category: 'Credential Exposure',
              title: 'Database Password in Environment File',
              description: `Database URL with password found in ${envFile}`,
              file: envFile,
              line: index + 1,
              solution: 'Use connection pooling with IAM authentication or separate password management',
              impact: 'Database credentials exposure can lead to data breach'
            });
          }

          // Check for API keys
          if (line.includes('API_KEY=') && !line.includes('CHANGEME')) {
            const value = line.split('=')[1];
            if (value && value.length > 20) {
              this.addVulnerability({
                type: 'medium',
                category: 'Credential Exposure',
                title: 'API Key in Environment File',
                description: `API key found in ${envFile} at line ${index + 1}`,
                file: envFile,
                line: index + 1,
                solution: 'Use secure API key rotation and environment-specific injection',
                impact: 'API key compromise can lead to service abuse'
              });
            }
          }
        });
      }
    }

    // Check for hardcoded secrets in source code
    const sourceFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: this.basePath,
      ignore: ['node_modules/**', '.next/**', 'dist/**', '.git/**']
    });

    for (const sourceFile of sourceFiles) {
      const fullPath = join(this.basePath, sourceFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Check for hardcoded secrets in code
          const secretPatterns = [
            /password\s*[:=]\s*['"]\w{8,}['"]/, // password: "hardcoded"
            /secret\s*[:=]\s*['"]\w{16,}['"]/, // secret: "hardcoded"
            /token\s*[:=]\s*['"]\w{20,}['"]/, // token: "hardcoded"
            /api_?key\s*[:=]\s*['"]\w{20,}['"]/ // apiKey: "hardcoded"
          ];

          secretPatterns.forEach(pattern => {
            if (pattern.test(line) && !line.includes('process.env')) {
              this.addVulnerability({
                type: 'critical',
                category: 'Credential Exposure',
                title: 'Hardcoded Secret in Source Code',
                description: `Potential hardcoded secret found in ${sourceFile} at line ${index + 1}`,
                file: sourceFile,
                line: index + 1,
                solution: 'Move secrets to environment variables and use proper secret management',
                impact: 'Critical security risk - secrets exposed in source code'
              });
            }
          });
        });
      }
    }
  }

  private async scanAuthenticationSecurity(): Promise<void> {
    console.log('🔑 Scanning authentication security...');

    // Check NextAuth configuration
    const authFile = join(this.basePath, 'apps/web/src/lib/auth.ts');
    if (existsSync(authFile)) {
      const content = readFileSync(authFile, 'utf-8');

      // Check for weak secret
      if (content.includes('secret: process.env.NEXTAUTH_SECRET || \'')) {
        const secretMatch = content.match(/secret: process.env.NEXTAUTH_SECRET \|\| '([^']+)'/);
        if (secretMatch && secretMatch[1].length < 32) {
          this.addVulnerability({
            type: 'high',
            category: 'Authentication',
            title: 'Weak NextAuth Secret Fallback',
            description: 'NextAuth fallback secret is too short or predictable',
            file: 'apps/web/src/lib/auth.ts',
            solution: 'Use a strong 32+ character secret and remove fallback',
            impact: 'Weak secrets can be brute-forced, compromising session security'
          });
        }
      }

      // Check for password validation
      if (!content.includes('bcrypt.compare')) {
        this.addVulnerability({
          type: 'critical',
          category: 'Authentication',
          title: 'Missing Password Hashing Verification',
          description: 'Password comparison not using secure hashing',
          file: 'apps/web/src/lib/auth.ts',
          solution: 'Use bcrypt.compare for password verification',
          impact: 'Insecure password validation can lead to authentication bypass'
        });
      }

      // Check for session configuration
      if (content.includes("strategy: 'jwt'") && !content.includes('maxAge')) {
        this.addVulnerability({
          type: 'medium',
          category: 'Authentication',
          title: 'No Session Expiration Configured',
          description: 'JWT sessions may not expire appropriately',
          file: 'apps/web/src/lib/auth.ts',
          solution: 'Configure session maxAge and implement refresh token rotation',
          impact: 'Long-lived sessions increase attack window'
        });
      }
    }

    // Check for missing CSRF protection
    const middlewareFile = join(this.basePath, 'apps/web/src/lib/auth-middleware.ts');
    if (existsSync(middlewareFile)) {
      const content = readFileSync(middlewareFile, 'utf-8');
      
      if (!content.includes('csrf') && !content.includes('X-CSRF-Token')) {
        this.addVulnerability({
          type: 'high',
          category: 'Authentication',
          title: 'Missing CSRF Protection',
          description: 'No CSRF token validation detected in middleware',
          file: 'apps/web/src/lib/auth-middleware.ts',
          solution: 'Implement CSRF token validation for state-changing operations',
          impact: 'Vulnerable to Cross-Site Request Forgery attacks'
        });
      }
    }
  }

  private async scanInputValidation(): Promise<void> {
    console.log('✅ Scanning input validation...');

    // Check API routes for input validation
    const apiFiles = glob.sync('**/api/**/route.ts', {
      cwd: this.basePath,
      ignore: ['node_modules/**']
    });

    for (const apiFile of apiFiles) {
      const fullPath = join(this.basePath, apiFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');

        // Check for direct req.body usage without validation
        if (content.includes('req.body') || content.includes('request.json()')) {
          if (!content.includes('zod') && !content.includes('joi') && !content.includes('validate')) {
            this.addVulnerability({
              type: 'high',
              category: 'Input Validation',
              title: 'Missing Input Validation',
              description: `API endpoint ${apiFile} processes request body without validation`,
              file: apiFile,
              solution: 'Implement input validation using Zod or similar schema validation',
              impact: 'Unvalidated input can lead to injection attacks and data corruption'
            });
          }
        }

        // Check for SQL injection risks
        if (content.includes('prisma.') && content.includes('${')) {
          this.addVulnerability({
            type: 'critical',
            category: 'Input Validation',
            title: 'Potential SQL Injection Risk',
            description: `String interpolation detected in ${apiFile} with database queries`,
            file: apiFile,
            solution: 'Use parameterized queries and Prisma client methods',
            impact: 'SQL injection can lead to data breach and system compromise'
          });
        }
      }
    }
  }

  private async scanSQLInjectionRisks(): Promise<void> {
    console.log('💉 Scanning SQL injection risks...');

    // Check for raw SQL queries
    const sourceFiles = glob.sync('**/*.{ts,tsx}', {
      cwd: this.basePath,
      ignore: ['node_modules/**', '.next/**']
    });

    for (const sourceFile of sourceFiles) {
      const fullPath = join(this.basePath, sourceFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for $queryRaw usage with string interpolation
          if (line.includes('$queryRaw') && (line.includes('${') || line.includes('+'))) {
            this.addVulnerability({
              type: 'critical',
              category: 'SQL Injection',
              title: 'Raw SQL Query with String Interpolation',
              description: `Dangerous raw SQL usage in ${sourceFile} at line ${index + 1}`,
              file: sourceFile,
              line: index + 1,
              solution: 'Use $queryRaw with Prisma.sql template or parameterized queries',
              impact: 'Direct SQL injection vulnerability'
            });
          }

          // Check for executeRaw with interpolation
          if (line.includes('$executeRaw') && (line.includes('${') || line.includes('+'))) {
            this.addVulnerability({
              type: 'critical',
              category: 'SQL Injection',
              title: 'Raw SQL Execution with String Interpolation',
              description: `Dangerous raw SQL execution in ${sourceFile} at line ${index + 1}`,
              file: sourceFile,
              line: index + 1,
              solution: 'Use $executeRaw with Prisma.sql template',
              impact: 'Direct SQL injection vulnerability'
            });
          }
        });
      }
    }
  }

  private async scanXSSVulnerabilities(): Promise<void> {
    console.log('🎭 Scanning XSS vulnerabilities...');

    // Check React components for dangerous props
    const componentFiles = glob.sync('**/*.{tsx,jsx}', {
      cwd: this.basePath,
      ignore: ['node_modules/**', '.next/**']
    });

    for (const componentFile of componentFiles) {
      const fullPath = join(this.basePath, componentFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for dangerouslySetInnerHTML
          if (line.includes('dangerouslySetInnerHTML')) {
            if (!line.includes('DOMPurify') && !line.includes('sanitize')) {
              this.addVulnerability({
                type: 'high',
                category: 'XSS',
                title: 'Unsanitized HTML Injection',
                description: `dangerouslySetInnerHTML used without sanitization in ${componentFile} at line ${index + 1}`,
                file: componentFile,
                line: index + 1,
                solution: 'Use DOMPurify or similar sanitization before setting innerHTML',
                impact: 'XSS vulnerability allowing script injection'
              });
            }
          }

          // Check for direct user input rendering
          if (line.includes('user.') && (line.includes('{') || line.includes('<'))) {
            if (!line.includes('escape') && !line.includes('sanitize')) {
              this.addVulnerability({
                type: 'medium',
                category: 'XSS',
                title: 'Potential Unescaped User Input',
                description: `User input rendered without escaping in ${componentFile} at line ${index + 1}`,
                file: componentFile,
                line: index + 1,
                solution: 'Ensure React automatic escaping or use explicit escaping for user input',
                impact: 'Potential XSS if user input contains malicious content'
              });
            }
          }
        });
      }
    }
  }

  private async scanCSRFProtection(): Promise<void> {
    console.log('🛡️ Scanning CSRF protection...');

    // Check for state-changing API routes without CSRF protection
    const apiFiles = glob.sync('**/api/**/route.ts', {
      cwd: this.basePath,
      ignore: ['node_modules/**']
    });

    for (const apiFile of apiFiles) {
      const fullPath = join(this.basePath, apiFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');

        // Check POST/PUT/DELETE methods without CSRF protection
        const hasStateChangingMethods = /export async function (POST|PUT|DELETE|PATCH)/.test(content);
        const hasCSRFProtection = content.includes('csrf') || content.includes('X-CSRF-Token') || content.includes('SameSite');

        if (hasStateChangingMethods && !hasCSRFProtection) {
          this.addVulnerability({
            type: 'high',
            category: 'CSRF',
            title: 'Missing CSRF Protection',
            description: `State-changing API endpoint ${apiFile} lacks CSRF protection`,
            file: apiFile,
            solution: 'Implement CSRF tokens or SameSite cookie attributes',
            impact: 'Vulnerable to Cross-Site Request Forgery attacks'
          });
        }
      }
    }
  }

  private async scanSessionSecurity(): Promise<void> {
    console.log('🍪 Scanning session security...');

    // Check NextAuth session configuration
    const authFile = join(this.basePath, 'apps/web/src/lib/auth.ts');
    if (existsSync(authFile)) {
      const content = readFileSync(authFile, 'utf-8');

      // Check for secure cookie configuration
      if (!content.includes('secure: true') && !content.includes('httpOnly: true')) {
        this.addVulnerability({
          type: 'medium',
          category: 'Session Security',
          title: 'Insecure Cookie Configuration',
          description: 'Session cookies not configured with secure flags',
          file: 'apps/web/src/lib/auth.ts',
          solution: 'Set secure: true, httpOnly: true, and sameSite: "strict" for session cookies',
          impact: 'Session cookies vulnerable to interception and XSS attacks'
        });
      }

      // Check for session timeout
      if (!content.includes('maxAge') && !content.includes('expires')) {
        this.addVulnerability({
          type: 'medium',
          category: 'Session Security',
          title: 'No Session Timeout',
          description: 'Sessions may not have appropriate timeout configured',
          file: 'apps/web/src/lib/auth.ts',
          solution: 'Configure session maxAge and implement idle timeout',
          impact: 'Long-lived sessions increase security risk'
        });
      }
    }
  }

  private async scanAPIEndpointSecurity(): Promise<void> {
    console.log('🔌 Scanning API endpoint security...');

    // Check for authentication on sensitive endpoints
    const apiFiles = glob.sync('**/api/**/route.ts', {
      cwd: this.basePath,
      ignore: ['node_modules/**']
    });

    for (const apiFile of apiFiles) {
      const fullPath = join(this.basePath, apiFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');

        // Check for admin endpoints without proper auth
        if (apiFile.includes('/admin/')) {
          if (!content.includes('requireAdmin') && !content.includes('requireAuth') && !content.includes('getServerSession')) {
            this.addVulnerability({
              type: 'critical',
              category: 'API Security',
              title: 'Unauthenticated Admin Endpoint',
              description: `Admin endpoint ${apiFile} lacks authentication`,
              file: apiFile,
              solution: 'Add requireAdmin() authentication check',
              impact: 'Unauthorized access to admin functionality'
            });
          }
        }

        // Check for rate limiting
        if (!content.includes('rateLimit') && !content.includes('throttle')) {
          this.addVulnerability({
            type: 'medium',
            category: 'API Security',
            title: 'Missing Rate Limiting',
            description: `API endpoint ${apiFile} lacks rate limiting`,
            file: apiFile,
            solution: 'Implement rate limiting to prevent abuse',
            impact: 'API abuse and DDoS vulnerability'
          });
        }

        // Check for input size limits
        if (content.includes('request.json()') && !content.includes('limit')) {
          this.addVulnerability({
            type: 'low',
            category: 'API Security',
            title: 'Missing Request Size Limits',
            description: `API endpoint ${apiFile} doesn't limit request body size`,
            file: apiFile,
            solution: 'Implement request body size limits',
            impact: 'Potential DoS through large payload attacks'
          });
        }
      }
    }
  }

  private async scanFileUploadSecurity(): Promise<void> {
    console.log('📁 Scanning file upload security...');

    // Check for file upload endpoints
    const sourceFiles = glob.sync('**/*.{ts,tsx}', {
      cwd: this.basePath,
      ignore: ['node_modules/**', '.next/**']
    });

    for (const sourceFile of sourceFiles) {
      const fullPath = join(this.basePath, sourceFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');

        if (content.includes('multipart/form-data') || content.includes('FormData') || content.includes('file upload')) {
          // Check for file type validation
          if (!content.includes('mimetype') && !content.includes('fileType') && !content.includes('extension')) {
            this.addVulnerability({
              type: 'high',
              category: 'File Upload',
              title: 'Missing File Type Validation',
              description: `File upload in ${sourceFile} lacks file type validation`,
              file: sourceFile,
              solution: 'Validate file types, extensions, and MIME types',
              impact: 'Malicious file upload leading to code execution'
            });
          }

          // Check for file size limits
          if (!content.includes('size') && !content.includes('limit')) {
            this.addVulnerability({
              type: 'medium',
              category: 'File Upload',
              title: 'Missing File Size Limits',
              description: `File upload in ${sourceFile} lacks size limits`,
              file: sourceFile,
              solution: 'Implement file size limits to prevent DoS',
              impact: 'DoS through large file uploads'
            });
          }
        }
      }
    }
  }

  private async scanDependencyVulnerabilities(): Promise<void> {
    console.log('📦 Scanning dependency vulnerabilities...');

    // Check package.json for known vulnerable packages
    const packageJsonPath = join(this.basePath, 'package.json');
    if (existsSync(packageJsonPath)) {
      const content = readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      const vulnerablePackages = [
        { name: 'lodash', version: '<4.17.21', issue: 'Prototype pollution vulnerabilities' },
        { name: 'moment', version: '*', issue: 'Deprecated package with security issues' },
        { name: 'request', version: '*', issue: 'Deprecated package with security issues' },
        { name: 'jquery', version: '<3.5.0', issue: 'XSS vulnerabilities in older versions' }
      ];

      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      for (const [depName, depVersion] of Object.entries(allDeps)) {
        const vulnerable = vulnerablePackages.find(v => v.name === depName);
        if (vulnerable) {
          this.addVulnerability({
            type: 'medium',
            category: 'Dependencies',
            title: `Vulnerable Dependency: ${depName}`,
            description: `${vulnerable.issue}`,
            file: 'package.json',
            solution: 'Update to latest secure version or find alternative package',
            impact: 'Security vulnerabilities in dependencies'
          });
        }
      }
    }
  }

  private async scanHTTPSConfiguration(): Promise<void> {
    console.log('🔒 Scanning HTTPS configuration...');

    // Check Next.js configuration for HTTPS
    const nextConfigPath = join(this.basePath, 'next.config.js');
    if (existsSync(nextConfigPath)) {
      const content = readFileSync(nextConfigPath, 'utf-8');

      if (!content.includes('https') && !content.includes('secure')) {
        this.addVulnerability({
          type: 'medium',
          category: 'HTTPS',
          title: 'HTTPS Not Enforced in Configuration',
          description: 'Next.js configuration does not enforce HTTPS',
          file: 'next.config.js',
          solution: 'Configure HTTPS redirects and security headers',
          impact: 'Traffic vulnerable to interception'
        });
      }
    }

    // Check for security headers
    const middlewareFiles = glob.sync('**/middleware.{ts,js}', {
      cwd: this.basePath,
      ignore: ['node_modules/**']
    });

    for (const middlewareFile of middlewareFiles) {
      const fullPath = join(this.basePath, middlewareFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');

        const securityHeaders = [
          'X-Content-Type-Options',
          'X-Frame-Options',
          'X-XSS-Protection',
          'Strict-Transport-Security',
          'Content-Security-Policy'
        ];

        const missingHeaders = securityHeaders.filter(header => !content.includes(header));
        
        if (missingHeaders.length > 0) {
          this.addVulnerability({
            type: 'medium',
            category: 'HTTPS',
            title: 'Missing Security Headers',
            description: `Missing security headers: ${missingHeaders.join(', ')}`,
            file: middlewareFile,
            solution: 'Add comprehensive security headers in middleware',
            impact: 'Reduced protection against common web attacks'
          });
        }
      }
    }
  }

  private async scanCORSConfiguration(): Promise<void> {
    console.log('🌐 Scanning CORS configuration...');

    // Check API routes for CORS configuration
    const apiFiles = glob.sync('**/api/**/route.ts', {
      cwd: this.basePath,
      ignore: ['node_modules/**']
    });

    for (const apiFile of apiFiles) {
      const fullPath = join(this.basePath, apiFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');

        // Check for wildcard CORS
        if (content.includes('Access-Control-Allow-Origin: *')) {
          this.addVulnerability({
            type: 'medium',
            category: 'CORS',
            title: 'Wildcard CORS Origin',
            description: `API ${apiFile} allows requests from any origin`,
            file: apiFile,
            solution: 'Restrict CORS to specific trusted origins',
            impact: 'CSRF and unauthorized cross-origin requests'
          });
        }

        // Check for missing CORS headers
        if (content.includes('POST') || content.includes('PUT')) {
          if (!content.includes('Access-Control') && !content.includes('cors')) {
            this.addVulnerability({
              type: 'low',
              category: 'CORS',
              title: 'Missing CORS Configuration',
              description: `API ${apiFile} lacks explicit CORS configuration`,
              file: apiFile,
              solution: 'Add explicit CORS headers for cross-origin requests',
              impact: 'Potential cross-origin security issues'
            });
          }
        }
      }
    }
  }

  private async scanRateLimiting(): Promise<void> {
    console.log('⏱️ Scanning rate limiting...');

    // Check for rate limiting middleware or implementation
    const hasRateLimiting = glob.sync('**/rate-limit*', {
      cwd: this.basePath,
      ignore: ['node_modules/**']
    }).length > 0;

    if (!hasRateLimiting) {
      this.addVulnerability({
        type: 'medium',
        category: 'Rate Limiting',
        title: 'No Rate Limiting Implementation',
        description: 'Application lacks rate limiting protection',
        solution: 'Implement rate limiting middleware for API endpoints',
        impact: 'Vulnerable to brute force attacks and API abuse'
      });
    }

    // Check API routes for rate limiting
    const apiFiles = glob.sync('**/api/**/route.ts', {
      cwd: this.basePath,
      ignore: ['node_modules/**']
    });

    let protectedEndpoints = 0;
    for (const apiFile of apiFiles) {
      const fullPath = join(this.basePath, apiFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');

        if (content.includes('rateLimit') || content.includes('throttle')) {
          protectedEndpoints++;
        }
      }
    }

    if (apiFiles.length > 0 && protectedEndpoints / apiFiles.length < 0.5) {
      this.addVulnerability({
        type: 'medium',
        category: 'Rate Limiting',
        title: 'Insufficient Rate Limiting Coverage',
        description: `Only ${protectedEndpoints}/${apiFiles.length} API endpoints have rate limiting`,
        solution: 'Add rate limiting to all public API endpoints',
        impact: 'Some endpoints vulnerable to abuse'
      });
    }
  }

  private async scanDataEncryption(): Promise<void> {
    console.log('🔐 Scanning data encryption...');

    // Check database schema for sensitive data
    const schemaFile = join(this.basePath, 'apps/web/prisma/schema.prisma');
    if (existsSync(schemaFile)) {
      const content = readFileSync(schemaFile, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for potentially sensitive fields without encryption
        const sensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount', 'personalId'];
        
        sensitiveFields.forEach(field => {
          if (line.toLowerCase().includes(field.toLowerCase()) && line.includes('String') && !line.includes('@encrypted')) {
            this.addVulnerability({
              type: 'high',
              category: 'Data Encryption',
              title: 'Sensitive Data Not Encrypted',
              description: `Sensitive field "${field}" not encrypted in database schema at line ${index + 1}`,
              file: 'apps/web/prisma/schema.prisma',
              line: index + 1,
              solution: 'Implement field-level encryption for sensitive data',
              impact: 'Sensitive data exposed if database is compromised'
            });
          }
        });
      });
    }

    // Check for password hashing
    const authFiles = glob.sync('**/auth*.{ts,js}', {
      cwd: this.basePath,
      ignore: ['node_modules/**']
    });

    let hasPasswordHashing = false;
    for (const authFile of authFiles) {
      const fullPath = join(this.basePath, authFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        if (content.includes('bcrypt') || content.includes('argon2') || content.includes('scrypt')) {
          hasPasswordHashing = true;
          break;
        }
      }
    }

    if (!hasPasswordHashing) {
      this.addVulnerability({
        type: 'critical',
        category: 'Data Encryption',
        title: 'Weak Password Hashing',
        description: 'No secure password hashing detected',
        solution: 'Implement bcrypt, argon2, or scrypt for password hashing',
        impact: 'Passwords vulnerable to rainbow table and brute force attacks'
      });
    }
  }

  private async scanLoggingSecurity(): Promise<void> {
    console.log('📝 Scanning logging security...');

    // Check for sensitive data in logs
    const sourceFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: this.basePath,
      ignore: ['node_modules/**', '.next/**']
    });

    for (const sourceFile of sourceFiles) {
      const fullPath = join(this.basePath, sourceFile);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for logging sensitive data
          if (line.includes('console.log') || line.includes('logger.')) {
            const sensitivePatterns = [
              /password/i,
              /token/i,
              /secret/i,
              /key/i,
              /authorization/i
            ];

            sensitivePatterns.forEach(pattern => {
              if (pattern.test(line)) {
                this.addVulnerability({
                  type: 'medium',
                  category: 'Logging Security',
                  title: 'Potential Sensitive Data in Logs',
                  description: `Possible sensitive data logging in ${sourceFile} at line ${index + 1}`,
                  file: sourceFile,
                  line: index + 1,
                  solution: 'Sanitize log output and avoid logging sensitive data',
                  impact: 'Sensitive data exposure in log files'
                });
              }
            });
          }
        });
      }
    }
  }

  private addVulnerability(vulnerability: SecurityVulnerability): void {
    this.vulnerabilities.push(vulnerability);
  }

  private generateReport(): SecurityScanResult {
    const criticalCount = this.vulnerabilities.filter(v => v.type === 'critical').length;
    const highCount = this.vulnerabilities.filter(v => v.type === 'high').length;
    const mediumCount = this.vulnerabilities.filter(v => v.type === 'medium').length;
    const lowCount = this.vulnerabilities.filter(v => v.type === 'low').length;

    // Calculate security score (0-100)
    const maxScore = 100;
    const criticalPenalty = criticalCount * 25;
    const highPenalty = highCount * 15;
    const mediumPenalty = mediumCount * 8;
    const lowPenalty = lowCount * 3;

    const totalPenalty = criticalPenalty + highPenalty + mediumPenalty + lowPenalty;
    const score = Math.max(0, maxScore - totalPenalty);

    // Determine grade
    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 95) grade = 'A+';
    else if (score >= 85) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 40) grade = 'D';
    else grade = 'F';

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      score,
      grade,
      totalVulnerabilities: this.vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      vulnerabilities: this.vulnerabilities,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations = [];

    if (this.vulnerabilities.some(v => v.category === 'Credential Exposure')) {
      recommendations.push('Implement proper secret management using Azure Key Vault or AWS Secrets Manager');
      recommendations.push('Rotate all exposed credentials immediately');
      recommendations.push('Add automated secret scanning to CI/CD pipeline');
    }

    if (this.vulnerabilities.some(v => v.category === 'Authentication')) {
      recommendations.push('Implement multi-factor authentication (MFA)');
      recommendations.push('Add account lockout policies for failed login attempts');
      recommendations.push('Use strong password policies and complexity requirements');
    }

    if (this.vulnerabilities.some(v => v.category === 'Input Validation')) {
      recommendations.push('Implement comprehensive input validation using Zod schema validation');
      recommendations.push('Add request body size limits to prevent DoS attacks');
      recommendations.push('Sanitize all user inputs before processing');
    }

    if (this.vulnerabilities.some(v => v.category === 'API Security')) {
      recommendations.push('Implement API rate limiting and throttling');
      recommendations.push('Add comprehensive API authentication and authorization');
      recommendations.push('Use API versioning and deprecation strategies');
    }

    if (this.vulnerabilities.some(v => v.category === 'Data Encryption')) {
      recommendations.push('Implement field-level encryption for sensitive data');
      recommendations.push('Use TLS 1.3 for all data in transit');
      recommendations.push('Regular security audits and penetration testing');
    }

    // Add general recommendations
    recommendations.push('Implement comprehensive security headers (CSP, HSTS, X-Frame-Options)');
    recommendations.push('Regular dependency updates and vulnerability scanning');
    recommendations.push('Implement comprehensive logging and monitoring');
    recommendations.push('Create incident response and security breach procedures');

    return recommendations;
  }
}

// Export for use in testing
export default MultiDropSecurityScanner;