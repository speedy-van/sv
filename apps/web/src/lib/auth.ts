/**
 * Authentication configuration for Speedy Van
 */

import { NextAuthOptions, getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

// Define UserRole locally to avoid circular dependency
export type UserRole = 'customer' | 'driver' | 'admin' | 'superadmin';

// Assertion functions for type safety
export function assertHasRole(
  session: any,
  roles: UserRole[]
): asserts session is { user: { id: string; email: string; name: string; role: UserRole } } {
  if (!session || !session.user || !roles.includes((session.user as any).role)) {
    throw new Error('UNAUTHORIZED');
  }
}

export function assertDriver(
  session: any
): asserts session is { user: { id: string; email: string; name: string; role: 'driver' } } {
  if (!session || (session.user as any)?.role !== 'driver') {
    throw new Error('FORBIDDEN');
  }
}

export function ensureDriver(session: any): Response | null {
  try {
    assertDriver(session);
    return null;
  } catch {
    return new Response('FORBIDDEN', { status: 403 });
  }
}

// Note: We don't use a database adapter because we're using JWT strategy
// and handling authentication manually via CredentialsProvider

export const authOptions: NextAuthOptions = {
  // No adapter needed for JWT-only authentication
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        try {
          console.log('🔐 NextAuth authorize called with:', {
            email: credentials?.email,
            hasPassword: !!credentials?.password,
            passwordLength: credentials?.password?.length,
            requestedRole: credentials?.role,
          });

          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing email or password');
            return null;
          }

          // Convert email to lowercase for case-insensitive lookup
          const normalizedEmail = credentials.email.toLowerCase().trim();
          console.log('📧 Normalized email:', normalizedEmail);

          console.log('🔍 Querying database for user...');
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
          });

          if (!user || !user.password) {
            console.log('❌ User not found or no password');
            return null;
          }

          console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            adminRole: user.adminRole,
            isActive: user.isActive,
            hasPassword: !!user.password,
            passwordHash: user.password?.substring(0, 20) + '...',
          });

          console.log('🔐 Comparing passwords...');
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('🔐 Password comparison result:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return null;
          }

          console.log('✅ Password is valid');

          // Check role if provided - allow admin login without specifying role
          // Handle 'undefined' string from client-side
          const requestedRole = credentials.role && credentials.role !== 'undefined' ? credentials.role : null;
          
          if (requestedRole && user.role !== requestedRole) {
            console.log('❌ Role mismatch:', {
              requested: requestedRole,
              actual: user.role,
            });
            return null;
          }

          // Check if user is active
          if (!user.isActive) {
            console.log('❌ User is not active');
            return null;
          }

          console.log('✅ Authorization successful, returning user');

          const returnUser = {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role as UserRole,
            adminRole: user.adminRole,
          };

          console.log('📦 Returning user object:', returnUser);

          return returnUser;
        } catch (error) {
          console.error('❌ Error in authorize function:', error);
          return null;
        }
      }
    }),
    // GoogleProvider temporarily disabled - no credentials configured
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Only log when user data is being added (not on every token refresh)
      if (user && !token.role) {
        console.log('🎫 Adding user data to JWT token:', {
          role: user.role,
          adminRole: (user as any).adminRole,
        });
        token.role = user.role;
        token.adminRole = (user as any).adminRole;
      }
      return token;
    },
    async session({ session, token }) {
      // Only update session if token has role data
      if (token && token.role) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        (session.user as any).adminRole = token.adminRole;
        console.log('✅ Session user data set:', {
          id: session.user.id,
          role: session.user.role,
          adminRole: (session.user as any).adminRole,
        });
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'ZV6xh/oJhYk9wwrjX5RA5JgjC9uCSuWZHpIprjYs2LA=',
};

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  return session.user;
}

export async function auth() {
  return await getServerSession(authOptions);
}

export async function requireRole(request: any, roles: string | string[]): Promise<NextResponse | { id: string; email: string; name: string; role: string }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!userRole || !requiredRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  
  return session.user as { id: string; email: string; name: string; role: string };
}

export async function requireDriver(request: any): Promise<NextResponse | { id: string; email: string; name: string; role: string }> {
  return requireRole(request, 'driver');
}

export async function requireAdmin(request: any): Promise<NextResponse | { id: string; email: string; name: string; role: string }> {
  return requireRole(request, 'admin');
}
