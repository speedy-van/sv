import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withApiHandler } from '@/lib/api/guard';

// Like/Unlike validation schema
const likeActionSchema = z.object({
  action: z.enum(['like', 'unlike']),
  userId: z.string().min(1, 'User ID is required'),
  userType: z.enum(['driver', 'admin']).default('driver'),
});

// POST /api/admin/stories/[id]/like - Like or unlike a story
async function handleStoryLike(request: NextRequest) {
  try {
    // Extract story ID from URL
    const url = new URL(request.url);
    const storyId = url.pathname.split('/').pop() || '';

    const body = await request.json();
    const validatedData = likeActionSchema.parse(body);

    const { action, userId, userType } = validatedData;

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

    if (action === 'like') {
      // Like the story (upsert to avoid duplicates)
      await prisma.storyLike.upsert({
        where: {
          storyId_userId: {
            storyId: storyId,
            userId: userId,
          },
        },
        update: {
          likedAt: new Date(),
        },
        create: {
          storyId: storyId,
          userId: userId,
          userType: userType,
        },
      });

      console.log(`❤️ ${userType} ${userId} liked story ${storyId}`);
    } else if (action === 'unlike') {
      // Unlike the story (delete the like record)
      await prisma.storyLike.deleteMany({
        where: {
          storyId: storyId,
          userId: userId,
        },
      });

      console.log(`💔 ${userType} ${userId} unliked story ${storyId}`);
    }

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
      action: action,
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

    console.error('Error handling story like:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process like action',
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/stories/[id]/like - Check if user liked the story
async function checkStoryLike(request: NextRequest) {
  try {
    // Extract story ID from URL
    const url = new URL(request.url);
    const storyId = url.pathname.split('/').pop() || '';

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType') || 'driver';

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId parameter is required',
        },
        { status: 400 }
      );
    }

    const like = await prisma.storyLike.findUnique({
      where: {
        storyId_userId: {
          storyId: storyId,
          userId: userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      isLiked: !!like,
      likedAt: like?.likedAt,
    });
  } catch (error) {
    console.error('Error checking story like:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check like status',
      },
      { status: 500 }
    );
  }
}

export const POST = withApiHandler(handleStoryLike);
export const GET = withApiHandler(checkStoryLike);
