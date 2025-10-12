/**
 * NextAuth Debug Utilities
 * 
 * This file contains utilities to debug NextAuth issues
 * and provide better error handling
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Debug NextAuth session with detailed logging
 */
export async function debugNextAuthSession() {
  try {
    console.log('🔍 NextAuth Debug Info:');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('NextAuth Secret exists:', !!process.env.NEXTAUTH_SECRET);
    console.log('NextAuth URL:', process.env.NEXTAUTH_URL);
    
    const session = await getServerSession(authOptions);
    console.log('Session exists:', !!session);
    console.log('Session data:', session);
    
    return session;
  } catch (error) {
    console.error('❌ NextAuth Debug Error:', error);
    return null;
  }
}

/**
 * Check NextAuth configuration
 */
export function checkNextAuthConfig() {
  const config = {
    secret: !!process.env.NEXTAUTH_SECRET,
    url: !!process.env.NEXTAUTH_URL,
    debug: process.env.NODE_ENV === 'development',
    trustHost: true,
    useSecureCookies: process.env.NODE_ENV === 'production',
  };
  
  console.log('🔧 NextAuth Configuration:', config);
  
  return config;
}

/**
 * Validate NextAuth environment variables
 */
export function validateNextAuthEnv() {
  const errors: string[] = [];
  
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is missing');
  } else if (process.env.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters');
  }
  
  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL) {
    errors.push('NEXTAUTH_URL is required in production');
  }
  
  if (errors.length > 0) {
    console.error('❌ NextAuth Environment Errors:', errors);
    return false;
  }
  
  console.log('✅ NextAuth Environment is valid');
  return true;
}

/**
 * Test NextAuth API endpoints
 */
export async function testNextAuthEndpoints(baseUrl: string = 'http://localhost:3000') {
  const endpoints = [
    '/api/auth/session',
    '/api/auth/providers',
    '/api/auth/csrf',
  ];
  
  const results: Record<string, any> = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      results[endpoint] = {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };
      
      if (response.ok) {
        try {
          results[endpoint].data = await response.json();
        } catch {
          results[endpoint].data = await response.text();
        }
      }
    } catch (error) {
      results[endpoint] = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  console.log('🧪 NextAuth Endpoints Test:', results);
  return results;
}

/**
 * Get NextAuth debug information
 */
export async function getNextAuthDebugInfo() {
  const info = {
    environment: process.env.NODE_ENV,
    config: checkNextAuthConfig(),
    envValidation: validateNextAuthEnv(),
    session: await debugNextAuthSession(),
    timestamp: new Date().toISOString(),
  };
  
  return info;
}
