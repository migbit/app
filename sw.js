// Define a cache name
const CACHE_NAME = 'app-cache-v1';

// Files to cache (all needed assets with the correct paths for GitHub Pages)
const ASSETS_TO_CACHE = [
    '/app/',  // The root index.html
    '/app/index.html',  // Main HTML
    '/app/css/styles.css',  // CSS styles
    '/app/js/caixa.js',  // JavaScript files
    '/app/js/cenas.js',
    '/app/js/compras.js',
    '/app/js/faturas.js',
    '/app/js/mensagens.js',
    '/app/js/reparações.js',
    '/app/js/script.js',
    '/app/js/tarefas.js',
    '/app/favicon.ico',  // Favicon
    '/app/icons/icon-192.png',  // Icons for PWA
    '/app/icons/icon-512.png',
    '/app/modules/caixa.html',  // Other HTML pages in the "modules" folder
    '/app/modules/cenas.html',
    '/app/modules/compras.html',
    '/app/modules/faturas.html',
    '/app/modules/ficheiros.html',
    '/app/modules/mensagens.html',
    '/app/modules/reparações.html',
    '/app/modules/tarefas.html',
    '/app/maps/123.jpg',  // Images from the "maps" folder
    '/app/maps/1248.jpg',
    '/app/modules/mensagensData.json'  // JSON file for data
];

// Install event: Cache all the necessary assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Fetch event: Serve files from cache first, then from network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
