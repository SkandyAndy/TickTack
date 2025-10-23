// Name des Caches. Ändere dies, um den Cache bei Updates zu erneuern.
const CACHE_NAME = 'work-time-calculator-v1.0';

// Dateien, die beim Installieren gecached werden sollen.
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'https://cdn.tailwindcss.com',
    'https://placehold.co/180x180/4338ca/ffffff?text=Zeit&font=inter',
    'https://placehold.co/192x192/4338ca/ffffff%3Ftext%3DZeit%26font%3Dinter',
    'https://placehold.co/512x512/4338ca/ffffff%3Ftext%3DZeit%26font%3Dinter'
];

// INSTALL Event: Cache füllen
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache wird gefüllt');
                // Füge alle definierten Assets zum Cache hinzu
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // Aktivierung erzwingen, sobald die Installation abgeschlossen ist
                return self.skipWaiting();
            })
    );
});

// ACTIVATE Event: Alte Caches löschen
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Lösche alle Caches, die nicht dem aktuellen CACHE_NAME entsprechen
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Alter Cache wird gelöscht', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Sofortige Kontrolle über alle Clients übernehmen
            return self.clients.claim();
        })
    );
});

// FETCH Event: Anfragen aus dem Cache bedienen (Cache-First-Strategie)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        // 1. Versuche, die Anfrage im Cache zu finden
        caches.match(event.request)
            .then((response) => {
                // 2. Wenn im Cache gefunden, zurückgeben
                if (response) {
                    return response;
                }
                
                // 3. Wenn nicht im Cache, über das Netzwerk holen
                // Wir cachen die Antwort nicht dynamisch, um den Cache sauber zu halten.
                // Nur die Assets in ASSETS_TO_CACHE sind offline verfügbar.
                return fetch(event.request);
            })
    );
});
