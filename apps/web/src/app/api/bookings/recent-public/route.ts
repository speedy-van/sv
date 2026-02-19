import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

/**
 * GET /api/bookings/recent-public
 * 
 * Public API endpoint for displaying recent bookings (social proof widget)
 * Returns anonymized booking data from the last 7 days
 * 
 * SEO Impact: Dynamic content updates, social proof signals to Google
 */
export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Query last 20 completed bookings from last 7 days
    const recentBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        actualDeliveryTime: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        customerName: true,
        serviceType: true,
        status: true,
        actualDeliveryTime: true,
        pickupAddress: {
          select: { label: true },
        },
        dropoffAddress: {
          select: { label: true },
        },
        driver: {
          select: { rating: true },
        },
      },
      orderBy: {
        actualDeliveryTime: 'desc',
      },
      take: 20,
    });

    // Transform to public-safe format
    const publicBookings = recentBookings.map((booking: any) => ({
      id: booking.id,
      customerName: anonymizeName(booking.customerName),
      from: extractCityFromLabel(
        booking.pickupAddress?.label || ''
      ),
      to: extractCityFromLabel(
        booking.dropoffAddress?.label || ''
      ),
      service: formatServiceType(booking.serviceType),
      status: 'completed' as const,
      rating: booking.driver?.rating 
        ? Math.round(booking.driver.rating * 10) / 10 
        : undefined,
      timeAgo: getTimeAgo(booking.actualDeliveryTime),
    }));

    // Shuffle and return 10 random bookings
    const shuffled = publicBookings.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    return NextResponse.json({
      bookings: selected,
      count: selected.length,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to fetch recent bookings:', error);
    
    // Return empty array on error (fail gracefully)
    return NextResponse.json({
      bookings: [],
      count: 0,
      error: 'Failed to load recent bookings',
    }, { status: 200 }); // Return 200 so widget can show fallback data
  }
}

// Helper functions

/**
 * Anonymize customer name for privacy
 * Example: "John Smith" → "John S."
 */
function anonymizeName(name: string): string {
  if (!name) return 'Anonymous';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0]; // Single name, keep as is
  }
  
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  
  return `${firstName} ${lastInitial}.`;
}

/**
 * Extract city name from BookingAddress.label
 * Label format: "City Name" or "Area, City"
 */
function extractCityFromLabel(label: string): string {
  if (!label) return 'Unknown';
  
  // If label contains comma, take the part after it
  if (label.includes(',')) {
    return label.split(',')[1].trim();
  }
  
  // Otherwise, return the whole label
  return label.trim();
}

/**
 * Format service type enum to display string
 */
function formatServiceType(serviceType: string | null): string {
  if (!serviceType) return 'Standard';
  
  switch (serviceType) {
    case 'STANDARD':
      return 'Man & Van';
    case 'HOUSE_REMOVAL':
      return 'House Removal';
    case 'OFFICE_REMOVAL':
      return 'Office Move';
    case 'FURNITURE':
      return 'Furniture Delivery';
    case 'SINGLE_ITEM':
      return 'Single Item';
    case 'STUDENT_MOVE':
      return 'Student Move';
    default:
      return serviceType.replace(/_/g, ' ');
  }
}

/**
 * Convert timestamp to "X hours/days ago" format
 */
function getTimeAgo(date: Date | null): string {
  if (!date) return 'Recently';
  
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return 'Last week';
  }
}

// Cache for 5 minutes (revalidate every 5 minutes)
export const revalidate = 300;
