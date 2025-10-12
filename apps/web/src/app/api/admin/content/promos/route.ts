import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
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
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        createdBy: session.user.id,
      },
    });

    // Log the action
    await logAudit(session.user.id, 'promotion_create', promotion.id, { targetType: 'promotion', before: null, after: { code, name, type, value, validFrom, validTo } });

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Promotions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
