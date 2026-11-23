/* 2026-11-23「加到主畫面」App 用的小幫手（Service Worker）
   - 只處理本站的 GET 請求，一律「先上網拿最新的」，拿不到（離線）才用上次存的。
   - 所以改網站後客人打開 App 一定是最新版，不會卡在舊畫面。
   - Firebase、CDN 等外部請求完全不碰。 */
const CACHE = 'project-cd-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res.ok && res.type === 'basic') {
                    const copy = res.clone();
                    caches.open(CACHE).then((c) => c.put(req, copy));
                }
                return res;
            })
            .catch(() =>
                caches.match(req).then((hit) =>
                    hit || (req.mode === 'navigate' ? caches.match('./') : Response.error())
                )
            )
    );
});
