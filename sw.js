/**
 * Boxing Day Countdown - Service Worker
 * Provides offline support and caching
 */

const CACHE_NAME = 'boxing-day-countdown-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/countdown.js',
    '/js/themes.js',
    '/js/storage.js',
    '/js/app.js',
    '/manifest.json'
];

const FONT_CACHE = 'boxing-day-fonts-v1';
const FONT_URLS = [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@300;400;600&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(FONT_CACHE).then((cache) => {
                return Promise.all(
                    FONT_URLS.map(url =>
                        fetch(url)
                            .then(response => cache.put(url, response))
                            .catch(err => console.log('Font cache failed:', err))
                    )
                );
            })
        ])
    );

    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== FONT_CACHE)
                    .map(name => caches.delete(name))
            );
        })
    );

    // Take control of all pages immediately
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip cross-origin requests except for fonts
    if (url.origin !== location.origin && !url.href.includes('fonts.googleapis.com') && !url.href.includes('fonts.gstatic.com')) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            // Return cached response if available
            if (cachedResponse) {
                // Update cache in background (stale-while-revalidate)
                event.waitUntil(
                    fetch(request)
                        .then(response => {
                            if (response.ok) {
                                const cacheName = url.href.includes('fonts') ? FONT_CACHE : CACHE_NAME;
                                caches.open(cacheName).then(cache => {
                                    cache.put(request, response);
                                });
                            }
                        })
                        .catch(() => { })
                );

                return cachedResponse;
            }

            // Fetch from network
            return fetch(request)
                .then((response) => {
                    // Don't cache non-ok responses
                    if (!response.ok) {
                        return response;
                    }

                    // Clone and cache the response
                    const responseToCache = response.clone();
                    const cacheName = url.href.includes('fonts') ? FONT_CACHE : CACHE_NAME;

                    caches.open(cacheName).then((cache) => {
                        cache.put(request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // Return offline fallback for navigation requests
                    if (request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }

                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
        })
    );
});

// Handle push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data?.text() || "It's Boxing Day!",
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'boxing-day-notification',
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Open Countdown' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Boxing Day Countdown', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-countdown') {
        event.waitUntil(
            // Sync any pending data
            Promise.resolve()
        );
    }
});

console.log('Boxing Day Countdown Service Worker loaded');
