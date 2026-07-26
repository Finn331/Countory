const CACHE_NAME = 'countory-v1';
const STATIC_CACHE = 'countory-static-v1';
const DYNAMIC_CACHE = 'countory-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/css/styles.css',
  '/js/main.js',
  '/js/opencv-detector.js',
  '/manifest.json',
  '/images/favicon.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Cache-first for static assets
  if (STATIC_ASSETS.some((asset) => url.pathname === asset || url.href === asset)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request);
      })
    );
    return;
  }

  // Network-first for pages
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scans') {
    event.waitUntil(syncScans());
  }
});

async function syncScans() {
  const db = await openDB();
  const tx = db.transaction('pendingScans', 'readwrite');
  const store = tx.objectStore('pendingScans');
  const scans = await getAllFromStore(store);

  for (const scan of scans) {
    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scan.data),
      });

      if (response.ok) {
        store.delete(scan.id);
      }
    } catch (err) {
      console.error('Sync failed for scan:', scan.id);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CountoryDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Push notification
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'Countory', body: 'Notifikasi baru' };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/images/icon-192.png',
      badge: '/images/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
