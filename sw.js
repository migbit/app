// Define a cache name
const CACHE_NAME = 'app-cache-v1';

// Files to cache (all needed assets)
const ASSETS_TO_CACHE = [
    './',  // The root index.html
    './index.html',  // Main HTML
    './css/styles.css',  // CSS styles
    './js/caixa.js',  // JavaScript files
    './js/cenas.js',
    './js/compras.js',
    './js/faturas.js',
    './js/mensagens.js',
    './js/reparações.js',
    './js/script.js',
    './js/tarefas.js',
    './favicon.ico',  // Favicon
    './icons/icon-192.png',  // Icons for PWA
    './icons/icon-512.png',
    './modules/caixa.html',  // Other HTML pages in the "modules" folder
    './modules/cenas.html',
    './modules/compras.html',
    './modules/faturas.html',
    './modules/ficheiros.html',
    './modules/mensagens.html',
    './modules/reparações.html',
    './modules/tarefas.html',
    './maps/123.jpg',  // Images from the "maps" folder
    './maps/1248.jpg',
    './modules/mensagensData.json'  // JSON file for data
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
