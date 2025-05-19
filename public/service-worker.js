// Service Worker for offline support and intelligent caching
const CACHE_NAME = 'finsight-v1';
const STATIC_CACHE_NAME = 'finsight-static-v1';
const API_CACHE_NAME = 'finsight-api-v1';
const IMAGE_CACHE_NAME = 'finsight-images-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/fonts/inter-var.woff2',
  '/images/sc-logo.png',
  '/images/finsight-logo.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('finsight-') && name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Network quality detection
let networkQuality = 'good';
let lastResponseTime = Date.now();

function updateNetworkQuality(responseTime) {
  const timeDiff = responseTime - lastResponseTime;
  lastResponseTime = responseTime;
  
  if (timeDiff > 3000) {
    networkQuality = 'poor';
  } else if (timeDiff > 1000) {
    networkQuality = 'moderate';
  } else {
    networkQuality = 'good';
  }
}

// Fetch event - implement network-aware caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests - network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Update network quality based on response time
          updateNetworkQuality(Date.now());
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache successful responses
          if (response.status === 200) {
            caches.open(API_CACHE_NAME)
              .then(cache => cache.put(request, responseToCache));
          }
          
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then(response => {
              if (response) {
                // Add header to indicate cached response
                const headers = new Headers(response.headers);
                headers.set('X-Cache-Status', 'HIT');
                return new Response(response.body, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: headers
                });
              }
              
              // Return offline fallback
              return new Response(JSON.stringify({ 
                error: 'Offline',
                message: 'No cached data available'
              }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }

  // Images - cache first, network fallback
  if (request.destination === 'image' || /\.(jpg|jpeg|png|webp|svg)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            // Return cached image
            return response;
          }
          
          // Fetch and cache new image
          return fetch(request).then(response => {
            // Don't cache non-200 responses
            if (!response || response.status !== 200) {
              return response;
            }
            
            const responseToCache = response.clone();
            
            // Determine image size based on network quality
            if (networkQuality === 'poor' && url.searchParams.has('quality')) {
              url.searchParams.set('quality', 'low');
              const downgradeRequest = new Request(url.toString(), request);
              return fetch(downgradeRequest).then(downgradeResponse => {
                caches.open(IMAGE_CACHE_NAME)
                  .then(cache => cache.put(request, downgradeResponse.clone()));
                return downgradeResponse;
              });
            }
            
            caches.open(IMAGE_CACHE_NAME)
              .then(cache => cache.put(request, responseToCache));
            
            return response;
          });
        })
    );
    return;
  }

  // Static assets - cache first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
    return;
  }

  // Default - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Update network quality
        updateNetworkQuality(Date.now());
        
        // Cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseToCache));
        }
        
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Get offline data from IndexedDB or localStorage
  const offlineData = await getOfflineData();
  
  for (const data of offlineData) {
    try {
      await fetch(data.url, {
        method: data.method,
        headers: data.headers,
        body: JSON.stringify(data.body)
      });
      
      // Remove synced data
      await removeOfflineData(data.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

// Simulated offline data functions (implement with IndexedDB)
async function getOfflineData() {
  // Implementation would use IndexedDB
  return [];
}

async function removeOfflineData(id) {
  // Implementation would use IndexedDB
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/images/sc-logo.png',
    badge: '/images/badge.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('FinSight Update', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});