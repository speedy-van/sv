import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';

/**
 * DEPRECATED: Use /api/admin/dispatch/mode instead
 * Kept for backward compatibility
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enabled } = await request.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Enabled status is required' },
        { status: 400 }
      );
    }

    return await withPrisma(async (prisma) => {
      // Deactivate old settings
      await prisma.dispatchSettings.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Create new settings
      const newSettings = await prisma.dispatchSettings.create({
        data: {
          mode: enabled ? 'auto' : 'manual',
          isActive: true,
          updatedBy: (session.user as any).id
        }
      });

      return NextResponse.json({
        success: true,
        message: `Auto-assignment ${enabled ? 'enabled' : 'disabled'}`,
        data: {
          enabled,
          mode: newSettings.mode,
          updatedAt: new Date().toISOString(),
        },
      });
    });
  } catch (error) {
    console.error('Auto-assign toggle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return await withPrisma(async (prisma) => {
      const settings = await prisma.dispatchSettings.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      const config = {
        enabled: settings?.mode === 'auto',
        mode: settings?.mode || 'manual',
        rules: {
          radius: settings?.autoAssignRadius || 5000,
          rating: settings?.minDriverRating || 4.0,
          maxJobs: settings?.maxDriverJobs || 3,
        },
        updatedAt: settings?.updatedAt?.toISOString() || new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: config,
      });
    });
  } catch (error) {
    console.error('Get auto-assign config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
