import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getPusherServer } from '@/lib/pusher';
import { withApiHandler, requireRole, httpJson } from '@/lib/api/guard';

// Story validation schema
const storySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['text', 'image', 'video']),
  mediaUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  publishedAt: z.string().datetime().optional().nullable(),
});

// GET /api/admin/stories - List all stories
async function getStories(request: NextRequest) {
  try {
    await requireRole(request, 'admin');

    const stories = await prisma.adminStory.findMany({
      orderBy: {
        createdAt: 'desc',
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

    // Transform the response to include stats
    const storiesWithStats = stories.map(story => ({
      ...story,
      stats: {
        viewCount: story._count.views,
        likeCount: story._count.likes,
        shareCount: story._count.shares,
      },
      _count: undefined, // Remove the raw _count field
    }));

    return httpJson(200, {
      success: true,
      stories: storiesWithStats,
    });
  } catch (error: any) {
    console.error('Error fetching stories:', error);
    return httpJson(500, {
      success: false,
      error: error.message || 'Failed to fetch stories',
    });
  }
}

// POST /api/admin/stories - Create new story
async function createStory(request: NextRequest) {
  try {
    await requireRole(request, 'admin');

    const body = await request.json();
    const validatedData = storySchema.parse(body);

    const story = await prisma.adminStory.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        mediaUrl: validatedData.mediaUrl,
        isActive: validatedData.isActive,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : null,
      },
    });

    // Trigger real-time sync via Pusher
    try {
      const pusher = getPusherServer();
      await pusher.trigger('admin-stories', 'story-created', {
        story,
        action: 'created',
        timestamp: new Date().toISOString(),
      });
      console.log('📡 Pushed story creation event');
    } catch (pusherError) {
      console.warn('⚠️ Failed to push story creation event:', pusherError);
    }

    return httpJson(201, {
      success: true,
      story,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return httpJson(400, {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Error creating story:', error);
    return httpJson(500, {
      success: false,
      error: error.message || 'Failed to create story',
    });
  }
}

// Export with authentication guards
export const GET = withApiHandler(getStories);
export const POST = withApiHandler(createStory);

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
