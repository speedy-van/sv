import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

/**
 * Public API: Get approved reviews for display
 * Supports filtering by city and rating
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const city = searchParams.get('city');
    const minRating = searchParams.get('minRating');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter criteria
    const where: any = {
      isApproved: true, // Only show approved reviews
    };

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    if (minRating) {
      where.rating = {
        gte: parseInt(minRating),
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.review.count({ where });

    // Get paginated reviews
    const reviews = await prisma.review.findMany({
      where,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        city: true,
        serviceType: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate statistics
    const stats = await prisma.review.aggregate({
      where: { isApproved: true },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    });

    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { isApproved: true },
      _count: {
        rating: true,
      },
    });

    // Anonymize customer names
    const anonymizedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      city: review.city,
      serviceType: review.serviceType,
      createdAt: review.createdAt,
      customerName: anonymizeName(review.user?.name || 'Anonymous'),
    }));

    return NextResponse.json({
      reviews: anonymizedReviews,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count._all,
        distribution: ratingDistribution.reduce((acc, item) => {
          acc[item.rating] = item._count.rating;
          return acc;
        }, {} as Record<number, number>),
      },
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * Anonymize customer name (e.g., "John Smith" -> "John S.")
 */
function anonymizeName(name: string): string {
  if (!name || name === 'Anonymous') return 'Anonymous';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0];
  }
  
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  
  return `${firstName} ${lastInitial}.`;
}
