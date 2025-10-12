import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  pusher,
  isAuthorizedForChannel
} from '@/lib/realtime/pusher-config';
import { 
  createSuccessResponse,
  createAuthErrorResponse,
  createValidationErrorResponse,
  createErrorResponse,
  generateRequestId 
} from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    let session = await getServerSession(authOptions);
    let userId: string | null = null;
    let userRole: string | null = null;

    // If no session (mobile app), check for JWT token
    if (!session?.user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          // Decode the simple token format: base64(userId:email:timestamp)
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const [decodedUserId, email, timestamp] = decoded.split(':');
          
          if (decodedUserId && email) {
            // Verify the token is not too old (24 hours)
            const tokenTime = parseInt(timestamp);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (now - tokenTime < maxAge) {
              // Find user in database
              const user = await prisma.user.findUnique({
                where: { id: decodedUserId, email },
                include: { Driver: true },
              });
              
              if (user) {
                userId = user.id;
                userRole = user.role;
                console.log(`[${requestId}] Mobile auth successful for user:`, userId);
              }
            }
          }
        } catch (error) {
          console.error(`[${requestId}] Token decode error:`, error);
        }
      }
    } else {
      userId = session.user.id;
      userRole = (session.user as any).role;
    }

    if (!userId || !userRole) {
      return createAuthErrorResponse('Authentication required for real-time access', requestId);
    }

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error(`[${requestId}] Error parsing request body:`, parseError);
      return createValidationErrorResponse(
        'body',
        'Invalid JSON in request body',
        requestId
      );
    }

    const { socket_id, channel_name } = requestBody || {};

    if (!socket_id || !channel_name) {
      console.error(`[${requestId}] Missing required parameters:`, { 
        socket_id: !!socket_id, 
        channel_name: !!channel_name 
      });
      
      if (!socket_id) {
        return createValidationErrorResponse(
          'socket_id',
          'Socket ID is required',
          requestId
        );
      }
      
      if (!channel_name) {
        return createValidationErrorResponse(
          'channel_name',
          'Channel name is required',
          requestId
        );
      }
    }

    // Basic channel name validation
    if (!channel_name || typeof channel_name !== 'string' || channel_name.length === 0) {
      console.error(`[${requestId}] Invalid channel name format:`, channel_name);
      return createValidationErrorResponse(
        'channel_name',
        'Invalid channel name format',
        requestId
      );
    }

    // Check permissions using improved permission system
    if (!isAuthorizedForChannel(channel_name, userId, userRole)) {
      console.error(`[${requestId}] Access denied for channel:`, {
        channel_name,
        userRole,
        userId: userId?.substring(0, 8) + '...' // Log partial ID for privacy
      });
      
      return createAuthErrorResponse(
        `Access denied to channel ${channel_name}. Insufficient permissions for role: ${userRole}`,
        requestId
      );
    }

    // For booking-specific channels, verify the user has access to that booking
    if (channel_name.includes('-')) {
      const bookingId = channel_name.split('-').pop();

      if (bookingId && userRole === 'customer') {
        // Verify customer owns this booking
        // This would require a database check in production
        // For now, we'll allow access
      } else if (bookingId && userRole === 'driver') {
        // Verify driver is assigned to this booking
        // This would require a database check in production
        // For now, we'll allow access
      }
    }

    // Generate auth response using Pusher server instance
    try {
      const authResponse = pusher.authenticate(socket_id, channel_name);
      
      if (!authResponse || typeof authResponse !== 'object') {
        throw new Error('Invalid auth response from Pusher');
      }
      
      console.log(`[${requestId}] ✅ Channel authorized successfully:`, {
        channel_name,
        userRole,
        userId: userId?.substring(0, 8) + '...'
      });
      
      return NextResponse.json(authResponse);
    } catch (authError) {
      console.error(`[${requestId}] ❌ Pusher authorization error:`, authError);
      return createErrorResponse(
        'Failed to authorize channel access',
        'PUSHER_AUTH_ERROR',
        requestId,
        process.env.NODE_ENV === 'development' ? { 
          error: authError instanceof Error ? authError.message : String(authError) 
        } : undefined,
        500
      );
    }
  } catch (error) {
    console.error(`[${requestId}] ❌ Pusher auth error:`, error);
    return createErrorResponse(
      'Internal server error during Pusher authentication',
      'INTERNAL_ERROR',
      requestId,
      process.env.NODE_ENV === 'development' ? { 
        error: error instanceof Error ? error.message : String(error) 
      } : undefined,
      500
    );
  }
}
