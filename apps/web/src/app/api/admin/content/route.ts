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
    const type = searchParams.get('type'); // service_areas, promotions, email_templates

    let data: any = {};

    if (!type || type === 'service_areas') {
      // Get service areas
      const serviceAreas = await prisma.serviceArea.findMany({
        orderBy: { createdAt: 'desc' },
      });
      data.serviceAreas = serviceAreas;
    }

    if (!type || type === 'promotions') {
      // Get promotions
      const promotions = await prisma.promotion.findMany({
        orderBy: { createdAt: 'desc' },
      });
      data.promotions = promotions;
    }

    if (!type || type === 'email_templates') {
      // Get email templates
      const emailTemplates = await prisma.emailTemplate.findMany({
        orderBy: { createdAt: 'desc' },
      });
      data.emailTemplates = emailTemplates;
    }

    // Get recent content versions
    const recentVersions = await prisma.contentVersion.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    data.recentVersions = recentVersions;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Content API error:', error);
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
    const { type, data, effectiveAt, notes } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a new version
    const version = await prisma.contentVersion.create({
      data: {
        type,
        data,
        effectiveAt: effectiveAt ? new Date(effectiveAt) : null,
        notes,
        createdBy: session.user.id,
        version: 1, // This will be calculated based on existing versions
      },
    });

    // Log the action
    await logAudit(session.user.id, 'content_version_create', version.id, { targetType: type, before: null, after: { type, effectiveAt, notes } });

    return NextResponse.json(version);
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
