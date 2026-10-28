// 班表111：離線快取。有網路時一律拿最新版並更新快取，沒網路時用快取。
// 注意：同一網域（saissa444.github.io）的其他舊 App 更新時可能清掉這裡的快取，
// 所以每次開啟 App 都會檢查並補回。
const CACHE = 'duty-hub-v8';   // 每次更新要和 index.html 的 APP_VERSION 一起改
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
const fill = () => caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))));
self.addEventListener('install', e => { e.waitUntil(fill().then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('duty-hub-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => {
  if (e.data === 'ensure-cache') e.waitUntil(caches.open(CACHE).then(c => c.match('./index.html')).then(hit => hit ? null : fill()).catch(() => {}));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request.url, { cache: 'no-store', credentials: 'same-origin' })
      .then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); } return r; })
      .catch(() => caches.match('./index.html', { ignoreSearch: true }).then(r => r || caches.match('./', { ignoreSearch: true }))));
    return;
  }
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
