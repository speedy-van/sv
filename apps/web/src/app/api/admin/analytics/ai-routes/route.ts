import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get time range from query params (default: last 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get AI-generated routes
    // Routes created via smart-generate API will have a specific pattern or flag
    // For now, we'll identify them by creation method or a specific field
    const aiRoutes = await prisma.route.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        // Add filter for AI-generated routes
        // This could be a flag like isAiGenerated or by checking creation source
      },
      include: {
        drops: true,
        driver: true,
      },
    });

    // Get manual routes for comparison
    const manualRoutes = await prisma.route.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        // Filter for manually created routes
      },
      include: {
        drops: true,
      },
    });

    // Calculate AI metrics
    const totalAiRoutes = aiRoutes.length;
    const completedAiRoutes = aiRoutes.filter(r => r.status === 'completed').length;
    const successRate = totalAiRoutes > 0 ? (completedAiRoutes / totalAiRoutes) * 100 : 0;

    // Calculate average efficiency (using drops per route as efficiency metric)
    const avgAiEfficiency = aiRoutes.length > 0
      ? aiRoutes.reduce((sum, r) => sum + (r.drops?.length || 0), 0) / aiRoutes.length
      : 0;

    // Calculate average drops per route
    const avgAiDrops = aiRoutes.length > 0
      ? aiRoutes.reduce((sum: number, r: any) => sum + (r.drops?.length || 0), 0) / aiRoutes.length
      : 0;

    const avgManualDrops = manualRoutes.length > 0
      ? manualRoutes.reduce((sum: number, r: any) => sum + (r.drops?.length || 0), 0) / manualRoutes.length
      : 0;

    // Calculate estimated time savings
    // Assume manual route creation takes 5 minutes, AI takes 10 seconds
    const timeSavedMinutes = totalAiRoutes * 4.83; // 5 min - 10 sec = 4.83 min

    // Calculate cost savings (estimate)
    // Assume admin time costs £20/hour
    const costSavings = (timeSavedMinutes / 60) * 20;

    // Get daily breakdown
    const dailyBreakdown = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayAiRoutes = aiRoutes.filter((r: any) => 
        r.createdAt >= date && r.createdAt < nextDate
      );

      const dayManualRoutes = manualRoutes.filter((r: any) =>
        r.createdAt >= date && r.createdAt < nextDate
      );

      dailyBreakdown.push({
        date: date.toISOString().split('T')[0],
        aiRoutes: dayAiRoutes.length,
        manualRoutes: dayManualRoutes.length,
        aiEfficiency: dayAiRoutes.length > 0
          ? dayAiRoutes.reduce((sum: number, r: any) => {
              const drops = r.drops || [];
              const avgScore = drops.length > 0
                ? drops.reduce((s: number, d: any) => s + (d.optimizationScore || 0), 0) / drops.length
                : 0;
              return sum + avgScore;
            }, 0) / dayAiRoutes.length
          : 0,
      });
    }

    // Get top performing AI routes (sorted by number of drops)
    const topAiRoutes = aiRoutes
      .filter((r: any) => r.status === 'completed')
      .map((r: any) => ({
        id: r.id,
        drops: r.drops?.length || 0,
        efficiency: r.drops && r.drops.length > 0
          ? r.drops.reduce((sum: number, d: any) => sum + (d.optimizationScore || 0), 0) / r.drops.length
          : 0,
        driver: r.driver?.user?.name || 'Unassigned',
        completedAt: r.completedAt,
      }))
      .sort((a: any, b: any) => b.efficiency - a.efficiency)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalAiRoutes,
          completedAiRoutes,
          successRate: Math.round(successRate * 10) / 10,
          avgEfficiency: Math.round(avgAiEfficiency * 10) / 10,
          avgAiDrops: Math.round(avgAiDrops * 10) / 10,
          avgManualDrops: Math.round(avgManualDrops * 10) / 10,
          timeSavedMinutes: Math.round(timeSavedMinutes),
          costSavings: Math.round(costSavings * 100) / 100,
        },
        comparison: {
          aiRoutes: totalAiRoutes,
          manualRoutes: manualRoutes.length,
          aiSuccessRate: Math.round(successRate * 10) / 10,
          manualSuccessRate: manualRoutes.length > 0
            ? Math.round((manualRoutes.filter((r: any) => r.status === 'completed').length / manualRoutes.length) * 1000) / 10
            : 0,
          efficiencyImprovement: avgManualDrops > 0
            ? Math.round(((avgAiDrops - avgManualDrops) / avgManualDrops) * 1000) / 10
            : 0,
        },
        dailyBreakdown,
        topRoutes: topAiRoutes,
      },
    });
  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI analytics' },
      { status: 500 }
    );
  }
}

