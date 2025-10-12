/**
 * NextAuth Configuration Utilities
 * 
 * This file contains utilities to manage NextAuth configuration
 * and provide better error handling
 */

import { NextAuthOptions } from 'next-auth';
import { authOptions } from './auth';

/**
 * Get NextAuth configuration with environment validation
 */
export function getNextAuthConfig(): NextAuthOptions {
  // Validate environment variables
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET is required');
  }

  if (process.env.NEXTAUTH_SECRET.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL) {
    throw new Error('NEXTAUTH_URL is required in production');
  }

  return {
    ...authOptions,
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookies: {
      sessionToken: {
        name: `next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
      callbackUrl: {
        name: `next-auth.callback-url`,
        options: {
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
      csrfToken: {
        name: `next-auth.csrf-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
    },
  };
}

/**
 * Validate NextAuth configuration
 */
export function validateNextAuthConfig(config: NextAuthOptions): boolean {
  try {
    if (!config.secret) {
      throw new Error('NextAuth secret is required');
    }

    if (config.secret.length < 32) {
      throw new Error('NextAuth secret must be at least 32 characters');
    }

    if (!config.providers || config.providers.length === 0) {
      throw new Error('At least one provider is required');
    }

    return true;
  } catch (error) {
    console.error('NextAuth configuration validation failed:', error);
    return false;
  }
}

/**
 * Get NextAuth URL for the current environment
 */
export function getNextAuthUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_URL is required in production');
  }

  return 'http://localhost:3000';
}

/**
 * Check if NextAuth is properly configured
 */
export function isNextAuthConfigured(): boolean {
  try {
    const config = getNextAuthConfig();
    return validateNextAuthConfig(config);
  } catch {
    return false;
  }
}
