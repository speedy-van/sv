import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { withPrisma } from '@/lib/prisma';
import Pusher from 'pusher';

export const dynamic = 'force-dynamic';

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

/**
 * GET /api/admin/dispatch/mode
 * Get current dispatch mode (auto or manual)
 */
export async function GET(request: NextRequest) {
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
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }
      
      userId = (session.user as any).id;
      isAdmin = (session.user as any).role === 'admin';
    }
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    return await withPrisma(async (prisma) => {
      // Get active dispatch settings
      let settings = await prisma.dispatchSettings.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      // If no settings exist, create default (manual mode)
      if (!settings) {
        settings = await prisma.dispatchSettings.create({
          data: {
            mode: 'manual',
            isActive: true,
            updatedBy: userId,
            autoAssignRadius: 5000,
            minDriverRating: 4.0,
            maxDriverJobs: 3,
            requireOnlineStatus: true
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          mode: settings.mode,
          isActive: settings.isActive,
          autoAssignRadius: settings.autoAssignRadius,
          minDriverRating: settings.minDriverRating,
          maxDriverJobs: settings.maxDriverJobs,
          requireOnlineStatus: settings.requireOnlineStatus,
          updatedAt: settings.updatedAt
        }
      });
    });

  } catch (error) {
    console.error('❌ Error fetching dispatch mode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispatch mode' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/dispatch/mode
 * Set dispatch mode (auto or manual)
 */
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
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }
      
      userId = (session.user as any).id;
      isAdmin = (session.user as any).role === 'admin';
    }
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { mode, settings } = await request.json();

    if (!mode || !['auto', 'manual'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "auto" or "manual"' },
        { status: 400 }
      );
    }

    console.log('🔄 Changing dispatch mode:', { mode, adminId: userId });

    return await withPrisma(async (prisma) => {
      // Deactivate all existing settings
      await prisma.dispatchSettings.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Create new settings
      const newSettings = await prisma.dispatchSettings.create({
        data: {
          mode: mode,
          isActive: true,
          updatedBy: userId,
          autoAssignRadius: settings?.autoAssignRadius || 5000,
          minDriverRating: settings?.minDriverRating || 4.0,
          maxDriverJobs: settings?.maxDriverJobs || 3,
          requireOnlineStatus: settings?.requireOnlineStatus !== false
        }
      });

      // Send real-time notification to all admins
      try {
        await pusher.trigger('admin-channel', 'dispatch-mode-changed', {
          mode: mode,
          changedBy: 'Admin',
          changedAt: new Date().toISOString(),
          settings: newSettings
        });

        console.log('📡 Dispatch mode change notification sent');
      } catch (pusherError) {
        console.error('⚠️ Failed to send Pusher notification:', pusherError);
      }

      console.log(`✅ Dispatch mode changed to: ${mode}`);

      return NextResponse.json({
        success: true,
        message: `Dispatch mode changed to ${mode}`,
        data: {
          mode: newSettings.mode,
          isActive: newSettings.isActive,
          autoAssignRadius: newSettings.autoAssignRadius,
          minDriverRating: newSettings.minDriverRating,
          maxDriverJobs: newSettings.maxDriverJobs,
          requireOnlineStatus: newSettings.requireOnlineStatus,
          updatedAt: newSettings.updatedAt
        }
      });
    });

  } catch (error) {
    console.error('❌ Error setting dispatch mode:', error);
    return NextResponse.json(
      { error: 'Failed to set dispatch mode' },
      { status: 500 }
    );
  }
}

