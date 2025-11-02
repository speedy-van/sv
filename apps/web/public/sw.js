// Service Worker for Speedy Van PWA
const CACHE_NAME = 'speedy-van-v1.0.1'; // Updated to force cache refresh
const STATIC_CACHE = 'speedy-van-static-v1.0.1'; // Updated to force cache refresh
const DYNAMIC_CACHE = 'speedy-van-dynamic-v1.0.1'; // Updated to force cache refresh

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/booking-luxury',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes to cache
const API_CACHE_PATTERNS = [
  '/api/pricing/quote',
  '/api/booking-luxury',
  '/api/notifications/email/send',
  '/api/notifications/sms/send',
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete ALL old caches to force refresh (fixes CSS/script tag issues)
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated - all old caches cleared');
        // Force all clients to use the new service worker immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isStaticFile(request)) {
    event.respondWith(handleStaticFile(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Check if request is for a static file
function isStaticFile(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Check if request is for an API endpoint
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// Check if request is for a page
function isPageRequest(request) {
  const url = new URL(request.url);
  return url.pathname === '/' || url.pathname.startsWith('/booking') || url.pathname.startsWith('/admin');
}

// Handle static file requests
async function handleStaticFile(request) {
  try {
    const url = new URL(request.url);
    
    // Ensure CSS files have correct content-type header
    if (url.pathname.endsWith('.css')) {
      // Always fetch CSS from network to avoid cache issues
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Create a new response with correct content-type
        const headers = new Headers(networkResponse.headers);
        headers.set('Content-Type', 'text/css; charset=utf-8');
        
        const cssResponse = new Response(networkResponse.body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers: headers
        });
        
        // Cache with correct headers
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, cssResponse.clone());
        
        return cssResponse;
      }
      
      return networkResponse;
    }
    
    // Try cache first for other static files
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Error handling static file:', error);
    return new Response('Static file not available offline', { status: 404 });
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  try {
    // For API requests, try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses for GET requests
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Error handling API request:', error);
    
    // Try to serve from cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Return offline response for API requests
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      offline: true,
      message: 'Please check your internet connection and try again.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle page requests
async function handlePageRequest(request) {
  try {
    // Try network first for pages
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Error handling page request:', error);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Serve offline page
    return caches.match('/offline') || new Response('Page not available offline', { status: 404 });
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.error('Error handling other request:', error);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response('Resource not available offline', { status: 404 });
  }
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'booking-sync') {
    event.waitUntil(syncBookingData());
  }
});

// Sync booking data when back online
async function syncBookingData() {
  try {
    // Get pending bookings from IndexedDB
    const pendingBookings = await getPendingBookings();
    
    for (const booking of pendingBookings) {
      try {
        // Try to submit the booking (migrated to booking-luxury)
        const response = await fetch('/api/booking-luxury', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(booking.data),
        });

        if (response.ok) {
          // Remove from pending list
          await removePendingBooking(booking.id);
          console.log('Synced booking:', booking.id);
        }
      } catch (error) {
        console.error('Error syncing booking:', booking.id, error);
      }
    }
  } catch (error) {
    console.error('Error in background sync:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    // Open the app to the relevant page
    event.waitUntil(
      clients.openWindow('/booking-luxury')
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingBookings() {
  // This would integrate with IndexedDB to get pending bookings
  // For now, return empty array
  return [];
}

async function removePendingBooking(id) {
  // This would remove the booking from IndexedDB
  console.log('Removing pending booking:', id);
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});