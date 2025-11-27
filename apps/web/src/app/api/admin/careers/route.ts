import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCustomSession } from '@/lib/custom-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Career applications API called');

    // Check authentication with dual-auth pattern
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin';
    
    if (!customSession?.user) {
      const session = await getServerSession(authOptions);
      isAdmin = session?.user?.role === 'admin';
      
      if (!session?.user || !isAdmin) {
        console.log('❌ Unauthorized access attempt');
        return NextResponse.json({ 
          success: false,
          error: 'Unauthorized' 
        }, { status: 401 });
      }
    }
    
    if (!isAdmin) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    console.log('📊 Query params:', { status, page, limit });

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch applications with pagination
    console.log('🔍 Fetching applications from database...');
    const [applications, total] = await Promise.all([
      prisma.careerApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.careerApplication.count({ where }),
    ]);

    console.log('✅ Found applications:', applications.length);
    console.log('📊 Total count:', total);

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching career applications:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // If CareerApplication table doesn't exist, return empty array
    if (error.message?.includes('does not exist')) {
      console.warn('⚠️ CareerApplication table not found - returning empty data');
      return NextResponse.json({
        success: true,
        data: {
          applications: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch applications',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

