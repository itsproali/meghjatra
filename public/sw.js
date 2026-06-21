// মেঘযাত্রা PWA সার্ভিস ওয়ার্কার — অ্যাপ ইনস্টলযোগ্য করে + হালকা অফলাইন সাপোর্ট দেয়।
const CACHE = 'meghjatra-v1';
const SHELL = ['/', '/cost', '/gallery', '/plan'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => {}) // কোনো একটা পেজ প্রিক্যাশ না হলেও ইনস্টল আটকাবে না
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// শুধু একই-অরিজিন GET রিকোয়েস্ট হ্যান্ডল করি (R2 ছবি cross-origin — ছোঁয় না)।
// network-first: অনলাইনে সবসময় তাজা ডেটা, অফলাইনে ক্যাশ থেকে।
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // API রেসপন্স ক্যাশ করি না

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match('/')))
  );
});
