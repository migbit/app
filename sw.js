// Define a cache name with timestamp for better version control
const CACHE_NAME = 'app-cache-v2-' + new Date().getTime();
const STATIC_CACHE_NAME = 'app-static-v2';

// Files to cache
const ASSETS_TO_CACHE = [
    '/app/',
    '/app/index.html',
    '/app/css/styles.css',
    '/app/js/caixa.js',
    '/app/js/cenas.js',
    '/app/js/compras.js',
    '/app/js/faturas.js',
    '/app/js/mensagens.js',
    '/app/js/reparações.js',
    '/app/js/script.js',
    '/app/js/tarefas.js',
    '/app/favicon.ico',
    '/app/icons/icon-192.png',
    '/app/icons/icon-512.png',
    '/app/modules/caixa.html',
    '/app/modules/cenas.html',
    '/app/modules/compras.html',
    '/app/modules/faturas.html',
    '/app/modules/ficheiros.html',
    '/app/modules/mensagens.html',
    '/app/modules/reparações.html',
    '/app/modules/tarefas.html',
    '/app/maps/123.jpg',
    '/app/maps/1248.jpg',
    '/app/modules/mensagensData.json'
];

// Install event: Cache all static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('Error caching static assets:', error);
            })
    );
});

// Fetch event: Network first for dynamic content, cache first for static assets
self.addEventListener('fetch', (event) => {
    event.respondWith(
        (async () => {
            const staticAsset = ASSETS_TO_CACHE.find(asset => 
                event.request.url.endsWith(asset));

            // For static assets: Cache First strategy
            if (staticAsset) {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
            }

            // For other requests: Network First strategy
            try {
                const networkResponse = await fetch(event.request);
                // Clone the response before using it
                const responseToCache = networkResponse.clone();

                // Cache successful responses
                if (networkResponse.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(event.request, responseToCache);
                }

                return networkResponse;
            } catch (error) {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                throw error;
            }
        })()
    );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Keep the current static cache and the most recent dynamic cache
                    if (cacheName !== STATIC_CACHE_NAME && 
                        cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Handle errors
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});