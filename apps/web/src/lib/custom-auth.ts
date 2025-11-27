import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'ZV6xh/oJhYk9wwrjX5RA5JgjC9uCSuWZHpIprjYs2LA='
);

export interface CustomSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    adminRole: string | null;
  };
}

export async function getCustomSession(): Promise<CustomSession | null> {
  try {
    const cookieStore = await cookies(); // Next.js 15 - async
    
    // Get all cookies for debugging
    const allCookies = cookieStore.getAll();
    const token = cookieStore.get('auth-token')?.value;

    console.log('🔍 getCustomSession - Cookie check:', {
      hasToken: !!token,
      tokenLength: token?.length,
      totalCookies: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      authTokenCookie: allCookies.find(c => c.name === 'auth-token') ? {
        name: 'auth-token',
        valueLength: allCookies.find(c => c.name === 'auth-token')?.value.length,
        valuePreview: allCookies.find(c => c.name === 'auth-token')?.value.substring(0, 20) + '...',
      } : 'NOT FOUND',
    });

    if (!token) {
      console.log('❌ getCustomSession - No auth-token cookie found (no token present)');
      console.log('📋 Available cookies:', allCookies.map(c => ({
        name: c.name,
        valueLength: c.value?.length || 0,
      })));
      console.log('⚠️  This usually means:');
      console.log('   1. Browser did not send the cookie (check SameSite/Secure/Domain)');
      console.log('   2. Cookie was blocked by browser privacy settings');
      console.log('   3. Cookie expired or was deleted');
      console.log('   4. Different domain/port between login and current request');
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    console.log('✅ getCustomSession - Token verified successfully for:', payload.email);

    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as string,
        adminRole: (payload.adminRole as string | null) || null,
      },
    };
  } catch (error) {
    console.error('❌ Custom session verification failed:', error);
    if (error instanceof Error) {
      console.error('   Error name:', error.name);
      console.error('   Error message:', error.message);
    }
    return null;
  }
}
