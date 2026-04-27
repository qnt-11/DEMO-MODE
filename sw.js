// Nama cache untuk versi Demo, ubah angka v1 jika nanti ada pembaruan besar
const CACHE_NAME = 'fambarla-demo-v1.50';

// Daftar file yang akan disimpan di memori HP (di-cache)
const urlsToCache = [
  './',
  './index.html', // Sesuaikan jika nama file HTML-mu berbeda
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. Event Install: Terjadi saat service worker pertama kali dipasang
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Membuka cache dan menyimpan aset statis...');
        return cache.addAll(urlsToCache);
      })
  );
  // Langsung paksa service worker baru untuk mengambil alih
  self.skipWaiting();
});

// 2. Event Activate: Terjadi saat service worker aktif, berguna untuk membersihkan cache lama
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Jika ada cache lama yang namanya tidak ada di whitelist, hapus!
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('SW: Menghapus cache lama', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Memastikan SW langsung mengontrol semua halaman yang terbuka
  self.clients.claim();
});

// 3. Event Fetch: Terjadi setiap kali aplikasi meminta data (loading halaman, gambar, dll)
self.addEventListener('fetch', event => {
  event.respondWith(
    // Coba cari data di cache terlebih dahulu
    caches.match(event.request)
      .then(response => {
        // Jika ditemukan di cache, kembalikan data tersebut (bisa offline)
        if (response) {
          return response;
        }
        // Jika tidak ada di cache, ambil dari internet (network)
        return fetch(event.request).catch(() => {
            // Jika gagal mengambil dari internet (misal: sedang offline) dan tidak ada di cache
            console.log('SW: Gagal mengambil data, status offline.');
        });
      })
  );
});

// 4. Menerima pesan dari halaman web (contoh: untuk menghapus cache jika user menekan tombol "Hapus Semua Data")
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
    console.log('SW: Semua cache berhasil dibersihkan via pesan.');
  }
});
