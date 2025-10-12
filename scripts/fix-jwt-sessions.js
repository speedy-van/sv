#!/usr/bin/env node

/**
 * NextAuth JWT Session Repair Tool
 * Fixes JWT session issues and cleans up corrupted tokens
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class JWTSessionRepair {
  constructor() {
    this.webAppPath = path.join(__dirname, '..', 'apps', 'web');
    this.envPath = path.join(this.webAppPath, '.env.local');
  }

  async repairJWTSessions() {
    console.log('🔧 Starting NextAuth JWT Session Repair...\n');

    // Step 1: Generate new secure secrets
    console.log('1️⃣ Generating new secure secrets...');
    const newSecret = this.generateSecureSecret();
    console.log(`   ✅ New NEXTAUTH_SECRET: ${newSecret.substring(0, 20)}...`);

    // Step 2: Update environment variables
    console.log('\n2️⃣ Updating environment variables...');
    await this.updateEnvironmentSecrets(newSecret);
    console.log('   ✅ Updated .env.local with new secrets');

    // Step 3: Create session cleanup script
    console.log('\n3️⃣ Creating session cleanup utilities...');
    await this.createSessionCleanupScript();
    console.log('   ✅ Session cleanup script created');

    // Step 4: Create NextAuth error handler
    console.log('\n4️⃣ Setting up error handlers...');
    await this.createErrorHandler();
    console.log('   ✅ Error handler configured');

    // Step 5: Instructions
    this.printInstructions();

    console.log('\n✅ JWT Session repair completed successfully!');
    return {
      newSecret,
      repairCompleted: true,
      nextSteps: [
        'Restart your development server',
        'Clear browser cookies and localStorage',
        'Test authentication flow'
      ]
    };
  }

  generateSecureSecret() {
    return crypto.randomBytes(32).toString('base64');
  }

  async updateEnvironmentSecrets(newSecret) {
    try {
      let envContent = '';
      
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, 'utf8');
      }

      // Update or add NEXTAUTH_SECRET
      if (envContent.includes('NEXTAUTH_SECRET=')) {
        envContent = envContent.replace(
          /NEXTAUTH_SECRET=.*/,
          `NEXTAUTH_SECRET=${newSecret}`
        );
      } else {
        envContent += `\nNEXTAUTH_SECRET=${newSecret}`;
      }

      // Update or add JWT_SECRET
      if (envContent.includes('JWT_SECRET=')) {
        envContent = envContent.replace(
          /JWT_SECRET=.*/,
          `JWT_SECRET=${newSecret}`
        );
      } else {
        envContent += `\nJWT_SECRET=${newSecret}`;
      }

      // Ensure NEXTAUTH_URL is set
      if (!envContent.includes('NEXTAUTH_URL=')) {
        envContent += '\nNEXTAUTH_URL=http://localhost:3000';
      }

      fs.writeFileSync(this.envPath, envContent);
    } catch (error) {
      console.error('Error updating environment variables:', error);
      throw error;
    }
  }

  async createSessionCleanupScript() {
    const cleanupScript = `
// Session cleanup utility
export function clearCorruptedSessions() {
  // Clear NextAuth cookies
  document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = '__Secure-next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Clear localStorage
  localStorage.removeItem('next-auth.session-token');
  localStorage.removeItem('next-auth.csrf-token');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  console.log('🧹 Session cleanup completed');
}

export function handleJWTError(error) {
  console.error('JWT Error detected:', error);
  
  if (error.message?.includes('JWE') || error.message?.includes('decrypt')) {
    console.log('🔧 Clearing corrupted JWT session...');
    clearCorruptedSessions();
    
    // Redirect to sign in
    window.location.href = '/auth/signin';
    return true;
  }
  
  return false;
}
`;

    const utilsPath = path.join(this.webAppPath, 'src', 'lib', 'session-cleanup.ts');
    fs.writeFileSync(utilsPath, cleanupScript.trim());
  }

  async createErrorHandler() {
    const errorHandler = `
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { error } = req.query;
  
  console.error('NextAuth Error:', error);
  
  // Handle specific JWT errors
  if (error === 'JWEDecryptionFailed' || error === 'JWT_SESSION_ERROR') {
    // Clear corrupted session cookies
    res.setHeader('Set-Cookie', [
      'next-auth.session-token=; Max-Age=0; Path=/',
      '__Secure-next-auth.session-token=; Max-Age=0; Path=/; Secure; HttpOnly',
      'next-auth.csrf-token=; Max-Age=0; Path=/',
      '__Secure-next-auth.csrf-token=; Max-Age=0; Path=/; Secure; HttpOnly'
    ]);
    
    return res.redirect('/auth/signin?error=SessionExpired');
  }
  
  // Default error page
  res.status(200).json({ 
    error: 'Authentication Error',
    message: 'Please try signing in again.',
    action: 'redirect_to_signin'
  });
}
`;

    const errorHandlerPath = path.join(
      this.webAppPath, 
      'src', 
      'pages', 
      'api', 
      'auth', 
      'error.ts'
    );
    
    // Create directories if they don't exist
    const errorHandlerDir = path.dirname(errorHandlerPath);
    fs.mkdirSync(errorHandlerDir, { recursive: true });
    
    fs.writeFileSync(errorHandlerPath, errorHandler.trim());
  }

  printInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 NEXT STEPS - Important Instructions');
    console.log('='.repeat(60));
    console.log('');
    console.log('1. 🔄 RESTART YOUR DEVELOPMENT SERVER:');
    console.log('   • Stop current server (Ctrl+C)');
    console.log('   • Run: cd apps/web && pnpm dev');
    console.log('');
    console.log('2. 🧹 CLEAR BROWSER DATA:');
    console.log('   • Open Developer Tools (F12)');
    console.log('   • Application → Storage → Clear storage');
    console.log('   • Or use incognito/private mode');
    console.log('');
    console.log('3. ✅ TEST AUTHENTICATION:');
    console.log('   • Visit: http://localhost:3000/auth/signin');
    console.log('   • Try signing in with credentials');
    console.log('   • Verify session persistence');
    console.log('');
    console.log('4. 🔍 MONITOR FOR ISSUES:');
    console.log('   • Check browser console for JWT errors');
    console.log('   • Check server logs for authentication issues');
    console.log('   • Test protected routes');
    console.log('');
    console.log('⚠️  If problems persist:');
    console.log('   • Delete node_modules and reinstall');
    console.log('   • Check database connectivity');
    console.log('   • Verify Prisma schema is up to date');
    console.log('');
    console.log('='.repeat(60));
  }

  // Utility method for development server restart
  restartDevelopmentServer() {
    console.log('\n🔄 Development Server Restart Required');
    console.log('Please restart your server with:');
    console.log('   cd apps/web && pnpm dev');
  }
}

// Run repair if called directly
if (require.main === module) {
  const repair = new JWTSessionRepair();
  repair.repairJWTSessions().catch(console.error);
}

module.exports = { JWTSessionRepair };