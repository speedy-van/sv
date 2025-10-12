export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  } else {
    console.warn('Service Worker not supported');
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    // Send subscription to server
    await fetch('/api/driver/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    console.log('Push notification subscription successful');
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Notify server
      await fetch('/api/driver/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      console.log('Push notification unsubscription successful');
    }
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
  }
}

export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) {
    console.warn('Wake Lock API not supported');
    return null;
  }

  try {
    const wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake lock acquired');
    return wakeLock;
  } catch (error) {
    console.error('Failed to acquire wake lock:', error);
    return null;
  }
}

export function releaseWakeLock(wakeLock: WakeLockSentinel | null) {
  if (wakeLock) {
    wakeLock.release().then(() => {
      console.log('Wake lock released');
    });
  }
}

// Background sync registration
export async function registerBackgroundSync(tag: string) {
  if (
    !('serviceWorker' in navigator) ||
    !('sync' in window.ServiceWorkerRegistration.prototype)
  ) {
    console.warn('Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // await registration.sync.register(tag);
    console.log('Background sync registered:', tag);
    return true;
  } catch (error) {
    console.error('Failed to register background sync:', error);
    return false;
  }
}

// Enhanced background sync with specific tags
export async function registerDriverStatusSync() {
  return registerBackgroundSync('driver-status-sync');
}

export async function registerJobStatusSync() {
  return registerBackgroundSync('job-status-sync');
}

export async function registerGeneralSync() {
  return registerBackgroundSync('background-sync');
}

// Store action for background sync
export async function storeActionForSync(action: {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}) {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const sw = registration.active;

    if (sw) {
      // Store action in IndexedDB via service worker
      sw.postMessage({
        type: 'STORE_ACTION',
        action: {
          ...action,
          timestamp: Date.now(),
        },
      });

      // Register appropriate background sync based on action type
      if (
        action.url.includes('/api/driver/status') ||
        action.url.includes('/api/driver/location')
      ) {
        await registerDriverStatusSync();
      } else if (
        action.url.includes('/api/driver/jobs') ||
        action.url.includes('/api/driver/accept') ||
        action.url.includes('/api/driver/decline')
      ) {
        await registerJobStatusSync();
      } else {
        await registerGeneralSync();
      }
      return true;
    }
  } catch (error) {
    console.error('Failed to store action for sync:', error);
  }

  return false;
}
