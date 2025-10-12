import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { subDays, startOfDay, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { metrics, dimensions, filters } = body;

    // Validate required fields
    if (!metrics || metrics.length === 0) {
      return new Response('Missing required metrics', { status: 400 });
    }

    const dateRange = filters?.dateRange || '30d';
    const days =
      dateRange === '7d'
        ? 7
        : dateRange === '90d'
          ? 90
          : dateRange === '6m'
            ? 180
            : 30;
    const since = subDays(new Date(), days);

    // Generate mock preview data based on metrics and dimensions
    const previewData = {
      summary: {
        totalRows: Math.floor(Math.random() * 100) + 50,
        dateRange: `${format(since, 'MMM dd')} - ${format(new Date(), 'MMM dd, yyyy')}`,
        metrics: metrics.length,
        dimensions: dimensions.length,
      },
      data: generateMockData(metrics, dimensions, days),
      metadata: {
        generatedAt: new Date().toISOString(),
        queryTime: Math.floor(Math.random() * 1000) + 100,
        cacheHit: Math.random() > 0.5,
      },
    };

    await logAudit(session.user.id, 'preview_report', undefined, { targetType: 'analytics_report', before: null, after: { metrics, dimensions, filters } });

    return Response.json(previewData);
  } catch (error) {
    console.error('Report preview error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

function generateMockData(
  metrics: string[],
  dimensions: string[],
  days: number
) {
  const data = [];
  const now = new Date();

  // Generate sample data based on dimensions
  if (dimensions.includes('date')) {
    // Time series data
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const row: any = {
        date: format(date, 'yyyy-MM-dd'),
      };

      metrics.forEach(metric => {
        row[metric] = generateMetricValue(metric);
      });

      data.push(row);
    }
  } else if (dimensions.includes('driver')) {
    // Driver-based data
    const drivers = [
      'John Smith',
      'Sarah Johnson',
      'Mike Wilson',
      'Emma Davis',
      'David Brown',
    ];
    drivers.forEach(driver => {
      const row: any = { driver };
      metrics.forEach(metric => {
        row[metric] = generateMetricValue(metric);
      });
      data.push(row);
    });
  } else if (dimensions.includes('area')) {
    // Area-based data
    const areas = [
      'Central London',
      'North London',
      'South London',
      'East London',
      'West London',
    ];
    areas.forEach(area => {
      const row: any = { area };
      metrics.forEach(metric => {
        row[metric] = generateMetricValue(metric);
      });
      data.push(row);
    });
  } else {
    // Default: single row with aggregated data
    const row: any = {};
    metrics.forEach(metric => {
      row[metric] = generateMetricValue(metric);
    });
    data.push(row);
  }

  return data;
}

function generateMetricValue(metric: string): number {
  switch (metric) {
    case 'revenue':
      return Math.floor(Math.random() * 10000) + 1000; // £1000-11000
    case 'orders':
      return Math.floor(Math.random() * 100) + 10; // 10-110 orders
    case 'aov':
      return Math.floor(Math.random() * 200) + 50; // £50-250
    case 'completion_rate':
      return Math.floor(Math.random() * 20) + 80; // 80-100%
    case 'avg_rating':
      return Math.floor(Math.random() * 2) + 4; // 4-5 stars
    case 'driver_earnings':
      return Math.floor(Math.random() * 500) + 100; // £100-600
    case 'retention_rate':
      return Math.floor(Math.random() * 30) + 60; // 60-90%
    case 'ltv':
      return Math.floor(Math.random() * 500) + 200; // £200-700
    case 'repeat_orders':
      return Math.floor(Math.random() * 20) + 5; // 5-25 orders
    case 'response_time':
      return Math.floor(Math.random() * 30) + 5; // 5-35 minutes
    case 'on_time_rate':
      return Math.floor(Math.random() * 15) + 85; // 85-100%
    case 'cancellation_rate':
      return Math.floor(Math.random() * 10) + 5; // 5-15%
    default:
      return Math.floor(Math.random() * 100) + 1;
  }
}
