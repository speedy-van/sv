import Pusher from 'pusher';

// Lazily create a singleton to avoid throwing during build when env vars are not set
let _pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (_pusherServer) return _pusherServer;

  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } =
    process.env;

  console.log('🔧 Pusher Config Check:', {
    hasAppId: !!PUSHER_APP_ID,
    hasKey: !!PUSHER_KEY,
    hasSecret: !!PUSHER_SECRET,
    hasCluster: !!PUSHER_CLUSTER,
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY?.substring(0, 10) + '...',
    cluster: PUSHER_CLUSTER
  });

  // For development, create a mock Pusher if credentials are not available
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    console.warn(
      '❌ Pusher credentials not found. Using mock Pusher for development.'
    );

    // Create a mock Pusher instance with enhanced logging
    _pusherServer = {
      trigger: async (channel: string, event: string, data: any) => {
        console.log(`🔶 [MOCK PUSHER] Channel: ${channel}`);
        console.log(`🔶 [MOCK PUSHER] Event: ${event}`);
        console.log(`🔶 [MOCK PUSHER] Data:`, JSON.stringify(data, null, 2));
        console.log(`🔶 [MOCK PUSHER] ⚠️ THIS IS A MOCK - NO REAL NOTIFICATION SENT!`);
        return Promise.resolve();
      },
      triggerBatch: async (batch: any[]) => {
        console.log('🔶 [MOCK PUSHER] Trigger batch:', batch);
        console.log(`🔶 [MOCK PUSHER] ⚠️ THIS IS A MOCK - NO REAL NOTIFICATION SENT!`);
        return Promise.resolve();
      },
    } as any;

    return _pusherServer!;
  }

  console.log('✅ Creating REAL Pusher instance with provided credentials');
  
  _pusherServer = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });

  return _pusherServer;
}
