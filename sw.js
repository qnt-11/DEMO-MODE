// Nama cache untuk versi Demo (Ubah angka versi jika nanti ada pembaruan besar)
const CACHE_NAME = 'fambarla-demo-v1.51';

// Daftar file utama (statis) yang wajib disimpan pertama kali (Pre-caching)
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. Event Install: Terjadi saat service worker pertama kali dipasang
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Membuka cache dan menyimpan aset utama...');
        return cache.addAll(urlsToCache);
      })
  );
  // Langsung paksa service worker baru untuk mengambil alih tanpa menunggu
  self.skipWaiting();
});

// 2. Event Activate: Terjadi saat service worker aktif, bertugas membersihkan cache versi lama
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Jika ada cache lama yang namanya tidak ada di daftar, hapus!
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('SW: Menghapus cache lama', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Memastikan SW langsung mengontrol semua halaman yang sedang terbuka
  self.clients.claim();
});

// 3. Event Fetch: Dynamic Caching (Membuat aplikasi 100% kebal Offline, termasuk Grafik & Font)
self.addEventListener('fetch', event => {
  // Hindari caching request yang bukan GET (seperti ekstensi Chrome atau API POST)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika file sudah ada di cache lokal, langsung gunakan! (Super cepat & hemat kuota)
        if (response) {
          return response;
        }

        // Jika tidak ada di cache (misal: Font dari Google atau Chart.js dari CDN), ambil dari internet
        return fetch(event.request).then(networkResponse => {
          // Pastikan respons dari internet valid sebelum disimpan ke memori HP
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
            return networkResponse;
          }

          // Gandakan (clone) respons internet untuk disimpan ke Cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          // Berikan respons aslinya ke aplikasi web
          return networkResponse;
        }).catch(() => {
          // Terpicu jika HP benar-benar tidak ada internet dan data belum ada di cache
          console.log('SW: Anda sedang offline, gagal memuat: ', event.request.url);
        });
      })
  );
});

// 4. Event Message: Menerima pesan dari aplikasi web (Klik "Hapus Semua Data")
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
