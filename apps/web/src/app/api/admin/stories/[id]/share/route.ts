import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withApiHandler } from '@/lib/api/guard';

// Share validation schema
const shareActionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  userType: z.enum(['driver', 'admin']).default('driver'),
  shareType: z.enum(['native', 'copy_link', 'social']).default('native'),
});

// POST /api/admin/stories/[id]/share - Share a story
async function handleStoryShare(request: NextRequest) {
  try {
    // Extract story ID from URL
    const url = new URL(request.url);
    const storyId = url.pathname.split('/').pop() || '';

    const body = await request.json();
    const validatedData = shareActionSchema.parse(body);

    const { userId, userType, shareType } = validatedData;

    // Check if story exists
    const story = await prisma.adminStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not found',
        },
        { status: 404 }
      );
    }

    // Track the share
    const share = await prisma.storyShare.create({
      data: {
        storyId: storyId,
        userId: userId,
        userType: userType,
      },
    });

    console.log(`📤 ${userType} ${userId} shared story ${storyId} via ${shareType}`);

    // Get updated stats
    const updatedStats = await prisma.adminStory.findUnique({
      where: { id: storyId },
      select: {
        _count: {
          select: {
            views: true,
            likes: true,
            shares: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      share: share,
      stats: {
        viewCount: updatedStats?._count.views || 0,
        likeCount: updatedStats?._count.likes || 0,
        shareCount: updatedStats?._count.shares || 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error handling story share:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process share action',
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/stories/[id]/share - Get share stats
async function getStoryShares(request: NextRequest) {
  try {
    // Extract story ID from URL
    const url = new URL(request.url);
    const storyId = url.pathname.split('/').pop() || '';

    const shares = await prisma.storyShare.findMany({
      where: {
        storyId: storyId,
      },
      orderBy: {
        sharedAt: 'desc',
      },
      take: 50, // Limit to recent shares
    });

    const shareCount = await prisma.storyShare.count({
      where: {
        storyId: storyId,
      },
    });

    return NextResponse.json({
      success: true,
      shareCount: shareCount,
      recentShares: shares,
    });
  } catch (error) {
    console.error('Error fetching story shares:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch share data',
      },
      { status: 500 }
    );
  }
}

export const POST = withApiHandler(handleStoryShare);
export const GET = withApiHandler(getStoryShares);
