import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('📞 GET /api/admin/me called - Route handler executed');
  
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      console.log('❌ Unauthorized - Admin access required');
      return authResult;
    }
    const sessionUser = authResult;
    
    console.log('✅ Admin session found:', { 
      userId: sessionUser.id, 
      email: sessionUser.email
    });
    
    // Log database connection info for debugging
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const isProductionDB = dbUrl.includes('ep-dry-glitter-aftvvy9d');
    const isDevelopmentDB = dbUrl.includes('ep-round-morning');
    const dbType = isProductionDB ? 'PRODUCTION' : 
                   isDevelopmentDB ? 'DEVELOPMENT' : 'UNKNOWN';
    console.log('🔗 Database connection:', dbType);

    // Try to find user by session ID first
    let adminUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminRole: true,
      },
    });

    // If not found by ID, try to find by email (fallback)
    if (!adminUser && sessionUser.email) {
      console.log('⚠️ User not found by ID, trying to find by email...');
      adminUser = await prisma.user.findUnique({
        where: { email: sessionUser.email?.toLowerCase().trim() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          adminRole: true,
        },
      });
      
      if (adminUser) {
        console.log('✅ User found by email, but ID mismatch:', {
          sessionId: sessionUser.id,
          dbId: adminUser.id,
          email: sessionUser.email
        });
      }
    }

    console.log('📊 Admin user query result:', adminUser ? 'Found' : 'Not found');
    if (adminUser) {
      console.log('📊 Admin user details:', {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      });
    }

    if (!adminUser) {
      console.log('❌ Admin user not found in database, falling back to session user');
      const fallbackAdmin = {
        id: sessionUser.id || 'session-only',
        name: sessionUser.name || 'Admin',
        email: sessionUser.email || '',
        role: sessionUser.role || 'admin',
        adminRole: (sessionUser as any).adminRole || null,
      };
      return NextResponse.json(
        {
          success: true,
          admin: fallbackAdmin,
          fallback: true,
          message: 'Admin user not found in database; using session data',
        },
        { status: 200 }
      );
    }

    console.log('✅ Admin user found, preparing response...');
    const responseData = {
      success: true,
      admin: {
        id: adminUser.id,
        name: adminUser.name || 'Admin',
        email: adminUser.email || '',
        role: adminUser.role || 'admin',
        adminRole: adminUser.adminRole || (sessionUser as any).adminRole || null,
      },
    };
    
    const response = NextResponse.json(responseData, { status: 200 });
    console.log('📤 Returning response:', { status: 200, hasData: !!adminUser });
    return response;
  } catch (error: any) {
    console.error('Get admin info error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get admin info',
      },
      { status: 500 }
    );
  }
}
