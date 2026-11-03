/* Service worker: cache-first do app inteiro, para funcionar offline.
   Aumente VERSION a cada publicação que altere arquivos. */
const VERSION = 'v35';
const CACHE = 'estoque-inteligente-' + VERSION;
const ARQUIVOS = ['./', 'index.html', 'privacidade.html', 'termos.html', 'css/style.css', 'js/data.js', 'js/taco.js', 'js/usda.js', 'js/meds.js', 'js/drive.js', 'js/financas.js', 'js/prontidao.js', 'js/engine.js', 'js/app.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* Rede primeiro (com limite de tempo) e cache como reserva: online, o app sempre abre com a versão mais nova publicada;
   sem internet ou com rede lenta, abre do cache. */
const LIMITE_MS = 4000;
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const rede = fetch(e.request, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    });
    try {
      return await Promise.race([rede, new Promise((_, rej) => setTimeout(() => rej(new Error('lento')), LIMITE_MS))]);
    } catch (err) {
      rede.catch(() => {});
      const hit = await cache.match(e.request, { ignoreSearch: true });
      return hit || (e.request.mode === 'navigate' ? cache.match('index.html') : Response.error());
    }
  })());
});
