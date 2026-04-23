// Nama cache untuk versi demo
const CACHE_NAME = 'demo-fambarla-cache-v1';

// Daftar file yang akan disimpan di HP agar bisa dibuka offline
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png' // Pastikan gambar ini ada di folder Anda
];

// 1. Proses Install: Menyimpan file-file penting ke memori HP (Cache)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: Caching Files');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. Proses Activate: Membersihkan cache versi lama jika ada update
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. Proses Fetch: Mengambil data dari Cache saat offline, atau dari Internet jika online
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // Jika file ada di cache, gunakan itu. Jika tidak, ambil dari internet.
            return response || fetch(event.request);
        }).catch(() => {
            // Jika offline dan file tidak ada di cache, arahkan ke index.html
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});

// 4. Proses Message: Mendengarkan perintah dari index.html (Misal: Tombol Hapus Semua Data diklik)
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'CLEAR_CACHE') {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
            });
        });
        console.log('Service Worker: Seluruh Cache telah dibersihkan sesuai perintah aplikasi.');
    }
});
