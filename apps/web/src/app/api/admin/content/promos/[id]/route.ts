import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Get single promotion by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const promotion = await prisma.promotion.findUnique({
      where: { id: params.id },
    });

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Promotions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update promotion
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if promotion exists
    const existingPromo = await prisma.promotion.findUnique({
      where: { id: params.id },
    });

    if (!existingPromo) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
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

    if (!code || !name || !type || !value || !validFrom || !validTo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if code already exists (and it's not the current promotion)
    if (code !== existingPromo.code) {
      const codeExists = await prisma.promotion.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Promotion code already exists' },
          { status: 409 }
        );
      }
    }

    // Update promotion
    const updatedPromo = await prisma.promotion.update({
      where: { id: params.id },
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
      },
    });

    // Log the action
    await logAudit(userId, 'promotion_update', params.id, {
      targetType: 'promotion',
      before: existingPromo,
      after: updatedPromo,
    });

    return NextResponse.json(updatedPromo);
  } catch (error) {
    console.error('Promotions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete promotion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if promotion exists
    const existingPromo = await prisma.promotion.findUnique({
      where: { id: params.id },
    });

    if (!existingPromo) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    // Delete promotion
    await prisma.promotion.delete({
      where: { id: params.id },
    });

    // Log the action
    await logAudit(userId, 'promotion_delete', params.id, {
      targetType: 'promotion',
      before: existingPromo,
      after: null,
    });

    return NextResponse.json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Promotions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

