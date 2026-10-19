/* 鼠仓 MouseKeeper PWA Service Worker
   策略：页面网络优先（保证原型更新即时生效），静态图标缓存优先，离线全部可回退缓存 */
const CACHE = 'mousekeeper-v1';
const PRECACHE = [
  './mouse-keeper-prototype.html',
  './manifest.webmanifest',
  './pwa-icon-192.png',
  './pwa-icon-512.png',
  './pwa-icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  const isIcon = /pwa-icon|apple-touch-icon/.test(url.pathname);

  if (isIcon) {
    // 图标：缓存优先
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
  } else {
    // 页面/manifest：网络优先，离线回退缓存
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
