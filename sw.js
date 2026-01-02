// Solar Explorer Service Worker v1.0.0
const CACHE_NAME = 'solar-explorer-v1.0.0';
const OFFLINE_URL = '/solar/offline.html';

// 캐시할 핵심 파일들
const CORE_ASSETS = [
  '/solar/',
  '/solar/index.html',
  '/solar/manifest.json',
  '/solar/offline.html'
];

// 캐시할 외부 라이브러리 (CDN)
const CDN_ASSETS = [
  'https://unpkg.com/three@0.160.0/build/three.module.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js',
  'https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.js',
  'https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_wasm_wrapper.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap'
];

// 설치 이벤트 - 핵심 파일 캐시
self.addEventListener('install', (event) => {
  console.log('[SW] 설치 중...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 핵심 파일 캐싱...');
        // 핵심 파일만 먼저 캐시 (실패해도 계속 진행)
        return Promise.allSettled(
          CORE_ASSETS.map(url => 
            cache.add(url).catch(err => console.log('[SW] 캐시 실패:', url))
          )
        );
      })
      .then(() => {
        console.log('[SW] 설치 완료');
        return self.skipWaiting(); // 즉시 활성화
      })
  );
});

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] 활성화 중...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] 오래된 캐시 삭제:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] 활성화 완료');
        return self.clients.claim(); // 모든 탭에 즉시 적용
      })
  );
});

// Fetch 이벤트 - 네트워크 우선, 캐시 폴백 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // POST 요청, WebSocket, Supabase API는 캐시하지 않음
  if (request.method !== 'GET' || 
      url.protocol === 'ws:' || 
      url.protocol === 'wss:' ||
      url.hostname.includes('supabase')) {
    return;
  }
  
  // 네비게이션 요청 (페이지 로드)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(OFFLINE_URL) || caches.match('/solar/');
        })
    );
    return;
  }
  
  // CDN 리소스 - 캐시 우선 전략 (변경이 적음)
  if (url.hostname.includes('unpkg.com') || 
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('jsdelivr.net')) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }
  
  // 이미지, 텍스처 - 캐시 우선
  if (request.destination === 'image' || 
      url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|glb|gltf)$/i)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => cachedResponse);
          
          return cachedResponse || fetchPromise;
        })
    );
    return;
  }
  
  // 기타 요청 - 네트워크 우선, 캐시 폴백
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 성공하면 캐시 업데이트
        if (response.ok && request.url.startsWith(self.location.origin)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 찾기
        return caches.match(request);
      })
  );
});

// 백그라운드 동기화 (나중에 멀티플레이어용)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-game-data') {
    console.log('[SW] 게임 데이터 동기화...');
  }
});

// 푸시 알림 (나중에 이벤트 알림용)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || '새로운 소식이 있습니다!',
      icon: '/solar/icons/icon-192x192.png',
      badge: '/solar/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/solar/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Solar Explorer', options)
    );
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/solar/')
  );
});

console.log('[SW] Service Worker 로드됨');
