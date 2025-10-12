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

    const serviceAreas = await prisma.serviceArea.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(serviceAreas);
  } catch (error) {
    console.error('Service areas API error:', error);
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
      name,
      description,
      postcodes,
      polygon,
      capacity,
      status,
      blackoutDates,
      surgeMultiplier,
    } = body;

    if (!name || !postcodes || !Array.isArray(postcodes)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new service area
    const serviceArea = await prisma.serviceArea.create({
      data: {
        name,
        description,
        postcodes,
        polygon,
        capacity: capacity || 100,
        status: status || 'active',
        blackoutDates: blackoutDates || [],
        surgeMultiplier: surgeMultiplier || 1.0,
        createdBy: session.user.id,
      },
    });

    // Log the action
    await logAudit(session.user.id, 'service_area_create', serviceArea.id, { targetType: 'service_area', before: null, after: { name, postcodes, capacity, status } });

    return NextResponse.json(serviceArea);
  } catch (error) {
    console.error('Service areas API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
