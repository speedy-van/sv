// Dynamically import Pusher only in the browser to avoid bundling it server-side

// Validate client-side Pusher configuration
const validatePusherConfig = () => {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn(
      'Pusher credentials not found. Using mock Pusher for development.'
    );
    return false;
  }

  // Pusher keys should not start with 'pk_live_' (that's Stripe)
  if (key.startsWith('pk_live_') || key.startsWith('pk_test_')) {
    console.error(
      'Invalid Pusher key detected. You may be using a Stripe key instead of a Pusher key.'
    );
    return false;
  }

  return true;
};

// Create a Pusher instance with proper configuration
export const createPusherClient = async (options?: {
  authEndpoint?: string;
  auth?: any;
}) => {
  if (typeof window === 'undefined') {
    throw new Error('Pusher client can only be initialized in the browser');
  }
  if (!validatePusherConfig()) {
    // Return a mock Pusher client for development
    return {
      subscribe: (channel: string) => ({
        bind: (event: string, callback: Function) => {
          console.log(
            `[Mock Pusher] Subscribed to ${channel}, bound to ${event}`
          );
        },
        unbind: (event: string) => {
          console.log(`[Mock Pusher] Unbound from ${channel}, event: ${event}`);
        },
      }),
      connection: {
        bind: (event: string, callback: Function) => {
          console.log(`[Mock Pusher] Connection event: ${event}`);
          if (event === 'connected') {
            setTimeout(() => callback(), 100);
          }
        },
      },
      disconnect: () => {
        console.log('[Mock Pusher] Disconnected');
      },
    } as any;
  }

  const { default: Pusher } = await import('pusher-js');
  return new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    ...options,
  });
};

// Create a Pusher instance for public channels (no auth required)
export const createPublicPusherClient = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Pusher client can only be initialized in the browser');
  }
  if (!validatePusherConfig()) {
    // Return a mock Pusher client for development
    return {
      subscribe: (channel: string) => ({
        bind: (event: string, callback: Function) => {
          console.log(
            `[Mock Pusher] Subscribed to ${channel}, bound to ${event}`
          );
        },
        unbind: (event: string) => {
          console.log(`[Mock Pusher] Unbound from ${channel}, event: ${event}`);
        },
      }),
      connection: {
        bind: (event: string, callback: Function) => {
          console.log(`[Mock Pusher] Connection event: ${event}`);
          if (event === 'connected') {
            setTimeout(() => callback(), 100);
          }
        },
      },
      disconnect: () => {
        console.log('[Mock Pusher] Disconnected');
      },
    } as any;
  }

  const { default: Pusher } = await import('pusher-js');
  return new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
  });
};
