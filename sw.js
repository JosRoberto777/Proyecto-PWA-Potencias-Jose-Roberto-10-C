const CACHE_NAME = 'potencias-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './datos.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;600&display=swap'
];

// 1. INSTALACIÓN: Guardamos los archivos en caché
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cacheando archivos');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVACIÓN: Limpiamos cachés viejos si los hubiera
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activado');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Borrando caché viejo', key);
          return caches.delete(key);
        }
      }));
    })
  );
});

// 3. FETCH: Interceptamos las peticiones.
// Si no hay internet, devolvemos lo que hay en caché.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si está en caché, lo devolvemos
      if (response) {
        return response;
      }
      // Si no, intentamos ir a internet
      return fetch(event.request).catch(() => {
        // Aquí podrías retornar una página de "offline.html" si quisieras
        console.log("Modo offline: No se pudo conectar");
      });
    })
  );
});