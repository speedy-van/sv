import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Pusher from 'pusher';

// Initialize Pusher for server-side notifications
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

interface NotificationPayload {
  type: 'new-job' | 'job-cancelled' | 'job-updated' | 'urgent-job';
  data: {
    bookingId: string;
    jobType: string;
    pickup: {
      address: string;
      postcode: string;
    };
    delivery: {
      address: string;
      postcode: string;
    };
    distance: number;
    estimatedDuration: number;
    price: number;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    customerName?: string;
  };
  timestamp: string;
  urgent?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { driverId, notification } = await request.json() as {
      driverId: string;
      notification: NotificationPayload;
    };

    if (!driverId || !notification) {
      return NextResponse.json(
        { error: 'Missing required fields: driverId, notification' },
        { status: 400 }
      );
    }

    // Validate notification data
    if (!notification.type || !notification.data || !notification.data.bookingId) {
      return NextResponse.json(
        { error: 'Invalid notification payload' },
        { status: 400 }
      );
    }

    const channelName = `driver-${driverId}`;
    const eventName = notification.type;

    // Send the notification through Pusher
    await pusher.trigger(channelName, eventName, {
      ...notification,
      timestamp: new Date().toISOString(),
    });

    console.log(`📤 Notification sent to driver ${driverId}:`, {
      channel: channelName,
      event: eventName,
      bookingId: notification.data.bookingId,
      type: notification.type,
    });

    // Optional: Log notification to database for tracking
    // You can add database logging here if needed

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      channelName,
      eventName,
      driverId,
    });

  } catch (error) {
    console.error('❌ Failed to send driver notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json(
        { error: 'Missing driverId parameter' },
        { status: 400 }
      );
    }

    // Send a test notification
    const testNotification: NotificationPayload = {
      type: 'new-job',
      data: {
        bookingId: `TEST-${Date.now()}`,
        jobType: 'Notification Test',
      pickup: {
          address: 'Riyadh, King Fahd Street',
          postcode: '12345',
        },
        delivery: {
          address: 'Jeddah, Red Sea Corniche',
          postcode: '54321',
        },
        distance: 15.5,
        estimatedDuration: 45,
        price: 75.00,
        priority: 'high',
        customerName: 'Test Customer',
      },
      timestamp: new Date().toISOString(),
      urgent: false,
    };

    const channelName = `driver-${driverId}`;
    await pusher.trigger(channelName, 'new-job', testNotification);

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
      notification: testNotification,
      channelName,
    });

  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}