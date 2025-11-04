import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getPusherServer } from '@/lib/pusher';

// Story update validation schema
const storyUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  type: z.enum(['text', 'image', 'video']).optional(),
  mediaUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
});

// GET /api/admin/stories/[id] - Get single story
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const story = await prisma.adminStory.findUnique({
      where: { id: params.id },
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

    if (!story) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not found',
        },
        { status: 404 }
      );
    }

    // Transform the response to include stats
    const storyWithStats = {
      ...story,
      stats: {
        viewCount: story._count.views,
        likeCount: story._count.likes,
        shareCount: story._count.shares,
      },
      _count: undefined, // Remove the raw _count field
    };

    return NextResponse.json({
      success: true,
      story: storyWithStats,
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch story',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/stories/[id] - Update story
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = storyUpdateSchema.parse(body);

    // Check if story exists
    const existingStory = await prisma.adminStory.findUnique({
      where: { id: params.id },
    });

    if (!existingStory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not found',
        },
        { status: 404 }
      );
    }

    const story = await prisma.adminStory.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : validatedData.publishedAt,
        updatedAt: new Date(),
      },
    });

    // Trigger real-time sync via Pusher
    try {
      const pusher = getPusherServer();
      await pusher.trigger('admin-stories', 'story-updated', {
        story,
        action: 'updated',
        timestamp: new Date().toISOString(),
      });
      console.log('📡 Pushed story update event');
    } catch (pusherError) {
      console.warn('⚠️ Failed to push story update event:', pusherError);
    }

    return NextResponse.json({
      success: true,
      story,
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

    console.error('Error updating story:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update story',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/stories/[id] - Partial update (for status toggles)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const story = await prisma.adminStory.update({
      where: { id: params.id },
      data: {
        ...body,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : body.publishedAt,
        updatedAt: new Date(),
      },
    });

    // Trigger real-time sync via Pusher
    try {
      const pusher = getPusherServer();
      await pusher.trigger('admin-stories', 'story-updated', {
        story,
        action: 'updated',
        timestamp: new Date().toISOString(),
      });
      console.log('📡 Pushed story partial update event');
    } catch (pusherError) {
      console.warn('⚠️ Failed to push story partial update event:', pusherError);
    }

    return NextResponse.json({
      success: true,
      story,
    });
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update story',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/stories/[id] - Delete story
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if story exists
    const existingStory = await prisma.adminStory.findUnique({
      where: { id: params.id },
    });

    if (!existingStory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not found',
        },
        { status: 404 }
      );
    }

    const deletedStory = await prisma.adminStory.delete({
      where: { id: params.id },
    });

    // Trigger real-time sync via Pusher
    try {
      const pusher = getPusherServer();
      await pusher.trigger('admin-stories', 'story-deleted', {
        storyId: params.id,
        action: 'deleted',
        timestamp: new Date().toISOString(),
      });
      console.log('📡 Pushed story deletion event');
    } catch (pusherError) {
      console.warn('⚠️ Failed to push story deletion event:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete story',
      },
      { status: 500 }
    );
  }
}

// Helper function to trigger story sync
async function triggerStorySync() {
  try {
    // This could trigger Pusher or other real-time mechanisms
    // For now, we'll just log the sync trigger
    console.log('🔄 Story sync triggered');
  } catch (error) {
    console.warn('Failed to trigger story sync:', error);
  }
}
