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
    const token = cookieStore.get('auth-token')?.value;
    
    // Debug: Log all cookies
    const allCookies = cookieStore.getAll();
    console.log('🍪 getCustomSession - All cookies:', allCookies.map(c => c.name));
    console.log('🔑 getCustomSession - auth-token exists:', !!token);

    if (!token) {
      // No token = guest user, this is normal - no need to log
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

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
    // Only log actual errors, not expected failures like expired tokens
    if (process.env.NODE_ENV === 'development') {
      console.error('Custom session verification failed:', error instanceof Error ? error.message : error);
    }
    return null;
  }
}
