import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('📞 GET /api/admin/me called - Route handler executed');
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      console.log('❌ Unauthorized - Admin access required');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    console.log('✅ Admin session found:', { 
      userId: session.user.id, 
      email: session.user.email
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
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // If not found by ID, try to find by email (fallback)
    if (!adminUser && session.user.email) {
      console.log('⚠️ User not found by ID, trying to find by email...');
      adminUser = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      
      if (adminUser) {
        console.log('✅ User found by email, but ID mismatch:', {
          sessionId: session.user.id,
          dbId: adminUser.id,
          email: session.user.email
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
      console.log('❌ Admin user not found in database');
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
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
