import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Try custom session first
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin';
    
    if (!customSession?.user) {
      // Fallback to NextAuth
      const session = await getServerSession(authOptions);
      isAdmin = (session?.user as any)?.role === 'admin';
      
      if (!session?.user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(promotions);
  } catch (error) {
    console.error('Promotions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try custom session first
    const customSession = await getCustomSession();
    let userId: string;
    let isAdmin = false;
    
    if (customSession?.user) {
      userId = customSession.user.id;
      isAdmin = customSession.user.role === 'admin';
    } else {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      userId = (session.user as any).id;
      isAdmin = (session.user as any).role === 'admin';
    }
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    console.log('📦 Received promo data:', JSON.stringify(body, null, 2));
    
    const {
      code,
      name,
      description,
      type,
      value,
      minSpend,
      maxDiscount,
      usageLimit,
      validFrom,
      validTo,
      status,
      applicableAreas,
      applicableVans,
      firstTimeOnly,
    } = body;

    console.log('🔍 Validation check:', { code, name, type, value, validFrom, validTo });

    if (!code || !name || !type || !value || !validFrom || !validTo) {
      console.error('❌ Missing fields:', { 
        hasCode: !!code, 
        hasName: !!name, 
        hasType: !!type, 
        hasValue: !!value, 
        hasValidFrom: !!validFrom, 
        hasValidTo: !!validTo 
      });
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['code', 'name', 'type', 'value', 'validFrom', 'validTo'],
          received: { code: !!code, name: !!name, type: !!type, value: !!value, validFrom: !!validFrom, validTo: !!validTo }
        },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingPromo = await prisma.promotion.findUnique({
      where: { code },
    });

    if (existingPromo) {
      return NextResponse.json(
        { error: 'Promotion code already exists' },
        { status: 409 }
      );
    }

    // Create new promotion
    const promotion = await prisma.promotion.create({
      data: {
        code,
        name,
        description,
        type,
        value,
        minSpend: minSpend || 0,
        maxDiscount: maxDiscount || 0,
        usageLimit: usageLimit || 1000,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        status: status || 'active',
        applicableAreas: applicableAreas || [],
        applicableVans: applicableVans || [],
        firstTimeOnly: firstTimeOnly || false,
        createdBy: userId,
      },
    });

    // Log the action
    await logAudit(userId, 'promotion_create', promotion.id, { targetType: 'promotion', before: null, after: { code, name, type, value, validFrom, validTo } });

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Promotions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
