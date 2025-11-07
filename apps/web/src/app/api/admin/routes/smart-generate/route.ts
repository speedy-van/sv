import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createUniqueReference } from '@/lib/ref';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Smart Route Generation API - DeepSeek Integration
 * Generates optimized multi-drop routes using AI
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingIds, date, driverId } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Booking IDs array is required' },
        { status: 400 }
      );
    }

    // Fetch bookings with full details (exclude test bookings)
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        status: 'CONFIRMED',
        // Only exclude obvious test/demo accounts - be more specific
        NOT: [
          { reference: { startsWith: 'test_' } },
          { reference: { startsWith: 'TEST_' } },
          { reference: { startsWith: 'demo_' } },
          { customerName: { equals: 'test', mode: 'insensitive' } },
          { customerName: { equals: 'demo', mode: 'insensitive' } },
          { customerName: { equals: 'test user', mode: 'insensitive' } },
          { customerName: { equals: 'demo user', mode: 'insensitive' } },
          { customerName: { startsWith: 'test ', mode: 'insensitive' } },
          { customerName: { startsWith: 'demo ', mode: 'insensitive' } },
        ],
      },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        BookingItem: true,
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (bookings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid bookings found' },
        { status: 404 }
      );
    }

    console.log(`🎯 Smart AI Route Generation: Processing ${bookings.length} live bookings with flexible clustering`);

    // 🔒 SECURITY FIX: Use environment variable for API key instead of hardcoding
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 500 }
      );
    }
    
    const prompt = `You are an expert logistics optimizer. Given the following delivery bookings, generate an optimal multi-drop route.

IMPORTANT: The system uses FLEXIBLE configuration - you MUST include ALL provided bookings in the route. 
Settings are guidelines only. Focus on optimal sequence rather than excluding bookings.

Bookings:
${bookings.map((b, idx) => `
Booking ${idx + 1}:
- Reference: ${b.reference}
- Customer: ${b.customerName}
- Pickup: ${b.pickupAddress.label}, ${b.pickupAddress.postcode}
- Dropoff: ${b.dropoffAddress.label}, ${b.dropoffAddress.postcode}
- Items: ${b.BookingItem.length} items
- Scheduled: ${b.scheduledAt}
`).join('\n')}

Analyze and provide:
1. Optimal delivery sequence (order of bookings)
2. Estimated total distance (miles)
3. Estimated total duration (hours)
4. Route efficiency score (0-100)
5. Potential issues or warnings
6. Recommendations for optimization

Return ONLY a JSON object with this structure:
{
  "sequence": [booking indices in optimal order, e.g., [0, 2, 1]],
  "totalDistance": number (miles),
  "totalDuration": number (hours),
  "efficiencyScore": number (0-100),
  "warnings": ["warning1", "warning2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "reasoning": "Brief explanation of the route optimization"
}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert logistics optimizer specializing in multi-drop delivery route optimization. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DeepSeek API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'AI service error' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('❌ No content in AI response');
      return NextResponse.json(
        { success: false, error: 'No AI response' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let routeOptimization;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        routeOptimization = JSON.parse(jsonMatch[0]);
      } else {
        routeOptimization = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', content);
      return NextResponse.json(
        { success: false, error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    // Validate sequence
    if (!routeOptimization.sequence || !Array.isArray(routeOptimization.sequence)) {
      return NextResponse.json(
        { success: false, error: 'Invalid route sequence from AI' },
        { status: 500 }
      );
    }

    // Reorder bookings based on AI sequence
    const optimizedBookings = routeOptimization.sequence.map((idx: number) => bookings[idx]);

    // Generate unified SV reference number
    const routeNumber = await createUniqueReference('route');

    // Calculate total outcome (safely handle large numbers)
    const totalOutcome = optimizedBookings.reduce((sum: number, b: any) => {
      const bookingTotal = Number(b.totalGBP || 0);
      // Safety check: if value is too large or NaN, use 0
      if (!Number.isFinite(bookingTotal) || bookingTotal > Number.MAX_SAFE_INTEGER || bookingTotal < 0) {
        console.warn(`⚠️ Invalid totalGBP for booking ${b.id}: ${b.totalGBP}`);
        return sum;
      }
      return sum + bookingTotal;
    }, 0);

    // Create route
    const route = await prisma.route.create({
      data: {
        reference: routeNumber,
        status: driverId ? 'assigned' : 'pending_assignment',
        driverId: driverId || null,
        totalDrops: optimizedBookings.length,
        completedDrops: 0,
        optimizedDistanceKm: routeOptimization.totalDistance * 1.609, // Convert miles to km
        estimatedDuration: Math.round(routeOptimization.totalDuration * 60), // Convert hours to minutes
        totalOutcome,
        startTime: date ? new Date(date) : new Date(),
        adminNotes: `AI-generated route using DeepSeek. ${routeOptimization.reasoning}`,
      },
    });

    // Update bookings with route assignment and sequence
    for (let i = 0; i < optimizedBookings.length; i++) {
      await prisma.booking.update({
        where: { id: optimizedBookings[i].id },
        data: {
          routeId: route.id,
          deliverySequence: i + 1,
          orderType: 'multi-drop',
          status: driverId ? 'CONFIRMED' : 'CONFIRMED',
        },
      });
    }

    // Create drops for each booking
    for (let i = 0; i < optimizedBookings.length; i++) {
      const booking = optimizedBookings[i];
      await prisma.drop.create({
        data: {
          routeId: route.id,
          bookingId: booking.id,
          customerId: booking.customerId!,
          pickupAddress: `${booking.pickupAddress.label}, ${booking.pickupAddress.postcode}`,
          deliveryAddress: `${booking.dropoffAddress.label}, ${booking.dropoffAddress.postcode}`,
          timeWindowStart: booking.scheduledAt,
          timeWindowEnd: new Date(booking.scheduledAt.getTime() + 4 * 60 * 60 * 1000), // 4 hours window
          quotedPrice: Number(booking.totalGBP || 0),
          status: 'booked',
        },
      });
    }

    console.log(`✅ Smart route generated: ${route.id} with ${optimizedBookings.length} bookings`);

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        bookingsCount: optimizedBookings.length,
        totalDistance: routeOptimization.totalDistance,
        totalDuration: routeOptimization.totalDuration,
        efficiencyScore: routeOptimization.efficiencyScore,
        totalOutcome,
      },
      optimization: {
        sequence: routeOptimization.sequence,
        warnings: routeOptimization.warnings || [],
        recommendations: routeOptimization.recommendations || [],
        reasoning: routeOptimization.reasoning,
      },
      bookings: optimizedBookings.map((b: any, idx: number) => ({
        id: b.id,
        reference: b.reference,
        sequence: idx + 1,
        customer: b.customerName,
        pickup: `${b.pickupAddress.label}`,
        dropoff: `${b.dropoffAddress.label}`,
      })),
    });
  } catch (error) {
    console.error('❌ Smart route generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

