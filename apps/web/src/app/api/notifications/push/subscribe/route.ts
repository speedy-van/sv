import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for push subscription
const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subscription = pushSubscriptionSchema.parse(body);

    // Store subscription in database or cache
    // For now, we'll just log it and return success
    console.log('Push subscription received:', {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      timestamp: new Date().toISOString(),
    });

    // TODO: Store subscription in database
    // await prisma.pushSubscription.create({
    //   data: {
    //     endpoint: subscription.endpoint,
    //     p256dhKey: subscription.keys.p256dh,
    //     authKey: subscription.keys.auth,
    //     userId: session?.user?.id,
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Push subscription registered successfully',
    });
  } catch (error) {
    console.error('Push subscription error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid subscription data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
