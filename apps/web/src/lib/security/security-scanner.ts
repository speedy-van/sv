import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

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

export class SecurityScanner {
  private vulnerabilities: SecurityVulnerability[] = [];
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
  }

  async performComprehensiveScan(): Promise<SecurityScanResult> {
    console.log('Starting comprehensive security scan...\n');
    
    this.vulnerabilities = [];

    await this.scanCredentialExposure();
    await this.scanAuthenticationSecurity();
    await this.scanInputValidation();
    await this.scanSQLInjectionRisks();
    await this.scanXSSVulnerabilities();
    await this.scanCSRFProtection();
    await this.scanSessionSecurity();
    await this.scanAPIEndpointSecurity();
    await this.scanDependencyVulnerabilities();
    await this.scanHTTPSConfiguration();
    await this.scanDataEncryption();

    return this.generateReport();
  }

  private getAllFiles(dirPath: string, extensions: string[] = []): string[] {
    const files: string[] = [];
    
    const walkDirectory = (currentPath: string) => {
      try {
        const items = readdirSync(currentPath);
        
        for (const item of items) {
          const itemPath = join(currentPath, item);
          const stat = statSync(itemPath);
          
          if (stat.isDirectory()) {
            if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
              walkDirectory(itemPath);
            }
          } else if (stat.isFile()) {
            if (extensions.length === 0 || extensions.includes(extname(item))) {
              files.push(itemPath);
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    };

    walkDirectory(dirPath);
    return files;
  }

  private async scanCredentialExposure(): Promise<void> {
    console.log('Scanning for credential exposure...');

    // Check .env files
    const envFiles = this.getAllFiles(this.basePath).filter(f => 
      f.includes('.env') || f.includes('config')
    );

    for (const envFile of envFiles) {
      if (existsSync(envFile)) {
        const content = readFileSync(envFile, 'utf-8');
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
    const sourceFiles = this.getAllFiles(this.basePath, ['.ts', '.tsx', '.js', '.jsx']);

    for (const sourceFile of sourceFiles) {
      if (existsSync(sourceFile)) {
        const content = readFileSync(sourceFile, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          const secretPatterns = [
            /password\s*[:=]\s*['"]\w{8,}['"]/, 
            /secret\s*[:=]\s*['"]\w{16,}['"]/, 
            /token\s*[:=]\s*['"]\w{20,}['"]/, 
            /api_?key\s*[:=]\s*['"]\w{20,}['"]/ 
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
    console.log('Scanning authentication security...');

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
  }

  private async scanInputValidation(): Promise<void> {
    console.log('Scanning input validation...');

    const apiFiles = this.getAllFiles(join(this.basePath, 'apps/web/src/app'), ['.ts'])
      .filter(f => f.includes('route.ts'));

    for (const apiFile of apiFiles) {
      if (existsSync(apiFile)) {
        const content = readFileSync(apiFile, 'utf-8');

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
    console.log('Scanning SQL injection risks...');

    const sourceFiles = this.getAllFiles(this.basePath, ['.ts', '.tsx']);

    for (const sourceFile of sourceFiles) {
      if (existsSync(sourceFile)) {
        const content = readFileSync(sourceFile, 'utf-8');
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
    console.log('Scanning XSS vulnerabilities...');

    const componentFiles = this.getAllFiles(this.basePath, ['.tsx', '.jsx']);

    for (const componentFile of componentFiles) {
      if (existsSync(componentFile)) {
        const content = readFileSync(componentFile, 'utf-8');
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
        });
      }
    }
  }

  private async scanCSRFProtection(): Promise<void> {
    console.log('Scanning CSRF protection...');

    const apiFiles = this.getAllFiles(join(this.basePath, 'apps/web/src/app'), ['.ts'])
      .filter(f => f.includes('route.ts'));

    for (const apiFile of apiFiles) {
      if (existsSync(apiFile)) {
        const content = readFileSync(apiFile, 'utf-8');

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
    console.log('Scanning session security...');

    const authFile = join(this.basePath, 'apps/web/src/lib/auth.ts');
    if (existsSync(authFile)) {
      const content = readFileSync(authFile, 'utf-8');

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
    console.log('Scanning API endpoint security...');

    const apiFiles = this.getAllFiles(join(this.basePath, 'apps/web/src/app'), ['.ts'])
      .filter(f => f.includes('route.ts'));

    for (const apiFile of apiFiles) {
      if (existsSync(apiFile)) {
        const content = readFileSync(apiFile, 'utf-8');

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
      }
    }
  }

  private async scanDependencyVulnerabilities(): Promise<void> {
    console.log('Scanning dependency vulnerabilities...');

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

      for (const [depName] of Object.entries(allDeps)) {
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
    console.log('Scanning HTTPS configuration...');

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
  }

  private async scanDataEncryption(): Promise<void> {
    console.log('Scanning data encryption...');

    const schemaFile = join(this.basePath, 'apps/web/prisma/schema.prisma');
    if (existsSync(schemaFile)) {
      const content = readFileSync(schemaFile, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
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
  }

  private addVulnerability(vulnerability: SecurityVulnerability): void {
    this.vulnerabilities.push(vulnerability);
  }

  private generateReport(): SecurityScanResult {
    const criticalCount = this.vulnerabilities.filter(v => v.type === 'critical').length;
    const highCount = this.vulnerabilities.filter(v => v.type === 'high').length;
    const mediumCount = this.vulnerabilities.filter(v => v.type === 'medium').length;
    const lowCount = this.vulnerabilities.filter(v => v.type === 'low').length;

    const maxScore = 100;
    const criticalPenalty = criticalCount * 25;
    const highPenalty = highCount * 15;
    const mediumPenalty = mediumCount * 8;
    const lowPenalty = lowCount * 3;

    const totalPenalty = criticalPenalty + highPenalty + mediumPenalty + lowPenalty;
    const score = Math.max(0, maxScore - totalPenalty);

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 95) grade = 'A+';
    else if (score >= 85) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 40) grade = 'D';
    else grade = 'F';

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

    recommendations.push('Implement comprehensive security headers (CSP, HSTS, X-Frame-Options)');
    recommendations.push('Regular dependency updates and vulnerability scanning');
    recommendations.push('Implement comprehensive logging and monitoring');
    recommendations.push('Create incident response and security breach procedures');

    return recommendations;
  }
}

export default SecurityScanner;