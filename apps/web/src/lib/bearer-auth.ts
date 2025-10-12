import { NextRequest } from 'next/server';
import { withPrisma, ensurePrismaConnection } from '@/lib/prisma';

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  console.log('🔍 Checking authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader) {
    console.log('❌ No authorization header found');
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.log('❌ Authorization header does not start with "Bearer "');
    return null;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('✅ Bearer token extracted:', token.substring(0, 20) + '...');
  
  return token;
}

/**
 * Decode and validate Bearer token
 */
export async function validateBearerToken(token: string): Promise<{
  isValid: boolean;
  user?: any;
  error?: string;
}> {
  try {
    console.log('🔐 Validating bearer token...');
    
    // Decode the base64 token
    const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, email, timestamp] = decodedToken.split(':');
    
    console.log('🔍 Decoded token - userId:', userId, 'email:', email);
    
    if (!userId || !email) {
      console.log('❌ Invalid token format - missing userId or email');
      return { isValid: false, error: 'Invalid token format' };
    }

    // Ensure database connection before querying
    await ensurePrismaConnection();

    // Find user in database with connection check
    const user = await withPrisma(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: { Driver: true },
      });
    });

    if (!user) {
      console.log('❌ User not found for userId:', userId);
      return { isValid: false, error: 'User not found' };
    }

    if (!user.isActive) {
      console.log('❌ User account is inactive:', userId);
      return { isValid: false, error: 'User account is inactive' };
    }

    console.log('✅ Bearer token validated successfully for user:', userId, 'role:', user.role);

    return {
      isValid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        driver: user.Driver,
      },
    };
  } catch (error) {
    console.error('❌ Bearer token validation error:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Middleware to authenticate Bearer tokens for mobile app
 */
export async function authenticateBearerToken(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  console.log('🔑 Starting bearer token authentication...');
  
  const token = extractBearerToken(request);
  
  if (!token) {
    console.log('❌ No Bearer token provided in request');
    return { success: false, error: 'No Bearer token provided' };
  }

  const validation = await validateBearerToken(token);
  
  if (!validation.isValid) {
    console.log('❌ Bearer token validation failed:', validation.error);
    return { success: false, error: validation.error };
  }

  console.log('✅ Bearer token authentication successful');
  
  return {
    success: true,
    user: validation.user,
  };
}
