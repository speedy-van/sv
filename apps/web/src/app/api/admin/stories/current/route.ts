import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withApiHandler } from '@/lib/api/guard';

export const dynamic = 'force-dynamic';

// GET /api/admin/stories/current - Get the current active story for drivers
async function getCurrentStory(request: NextRequest) {
  try {
    // Find the most recent active story with engagement stats
    const currentStory = await prisma.adminStory.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        publishedAt: 'desc', // Most recently published first
      },
      include: {
        _count: {
          select: {
            views: true,
            likes: true,
            shares: true,
          },
        },
      },
    });

    if (!currentStory) {
      return NextResponse.json({
        success: true,
        story: null,
      });
    }

    // Track view if this is accessed by a driver (has user-agent and comes from mobile app)
    const userAgent = request.headers.get('user-agent') || '';
    const isMobileApp = userAgent.includes('Expo') || userAgent.includes('React Native');

    if (isMobileApp) {
      // Try to get user ID from headers (assuming we pass it from the mobile app)
      const userId = request.headers.get('x-user-id');
      const userType = request.headers.get('x-user-type') || 'driver';

      if (userId) {
        try {
          // Track the view (upsert to avoid duplicates)
          await prisma.storyView.upsert({
            where: {
              storyId_userId: {
                storyId: currentStory.id,
                userId: userId,
              },
            },
            update: {
              viewedAt: new Date(),
            },
            create: {
              storyId: currentStory.id,
              userId: userId,
              userType: userType,
            },
          });
          console.log(`👁️ Tracked view for story ${currentStory.id} by ${userType} ${userId}`);
        } catch (viewError) {
          console.warn('⚠️ Failed to track story view:', viewError);
          // Don't fail the request if view tracking fails
        }
      }
    } else {
      // Track admin views as well
      const userId = request.headers.get('x-user-id') || 'system';
      const userType = 'admin';

      try {
        await prisma.storyView.upsert({
          where: {
            storyId_userId: {
              storyId: currentStory.id,
              userId: userId,
            },
          },
          update: {
            viewedAt: new Date(),
          },
          create: {
            storyId: currentStory.id,
            userId: userId,
            userType: userType,
          },
        });
        console.log(`👁️ Tracked admin view for story ${currentStory.id}`);
      } catch (viewError) {
        console.warn('⚠️ Failed to track admin story view:', viewError);
        // Don't fail the request if view tracking fails
      }
    }

    return NextResponse.json({
      success: true,
      story: {
        ...currentStory,
        stats: {
          viewCount: currentStory._count.views,
          likeCount: currentStory._count.likes,
          shareCount: currentStory._count.shares,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching current story:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch current story',
      },
      { status: 500 }
    );
  }
}

export const GET = withApiHandler(getCurrentStory);
