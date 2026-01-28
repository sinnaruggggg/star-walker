// ★★★ Solar System Game - Service Worker ★★★
// 에셋 캐싱으로 로딩 속도 개선 및 데이터 절약

const CACHE_NAME = 'solar-game-v1';

// 캐시할 에셋 목록
const ASSETS_TO_CACHE = [
    // 핵심 파일
    '/',
    '/index.html',
    '/css/main.css',
    '/js/main.js',
    '/js/multiplayer.js',
    '/js/systems.js',
    '/js/mission.js',
    '/js/cockpit-buttons.js',
    '/supabase.min.js',

    // GLB 모델들 (우주선)
    '/corvette_model_1766592781.glb',
    '/explorer_model_1766457987.glb',
    '/freighter_model_1765906618.glb',
    '/interceptor_model_1765905786.glb',
    '/uploads/ships/화물선.glb',
    '/uploads/ships/인터셉터.glb',
    '/uploads/ships/탐사선.glb',
    '/uploads/ships/셔틀.glb',

    // 텍스처 (행성)
    '/jupiter_1765902587.jpg',
    '/mars_1765902547.jpg',
    '/mercury_1765902026.jpg',
    '/moon_1765907677.jpg',
    '/saturn_1765902576.jpg',
    '/saturn_ring_1765903886.png',
    '/uranus_1765903664.jpg',
    '/venus_1765902007.jpg',

    // 우주선 썸네일
    '/corvette_1766596560.png',
    '/explorer_1766457854.png',
    '/freighter_1765288722.png',
    '/interceptor_1765905786.png',

    // 아이콘
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',

    // BGM
    '/bgm/1766626713_beyond-the-veil-242451.mp3'
];

// 설치 이벤트 - 에셋 프리캐시
self.addEventListener('install', (event) => {
    console.log('[SW] 설치 중...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 에셋 캐싱 시작');
                return Promise.allSettled(
                    ASSETS_TO_CACHE.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('[SW] 캐시 실패:', url);
                            return null;
                        })
                    )
                );
            })
            .then(() => {
                console.log('[SW] 설치 완료');
                return self.skipWaiting();
            })
    );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', (event) => {
    console.log('[SW] 활성화 중...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] 이전 캐시 삭제:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] 활성화 완료');
                return self.clients.claim();
            })
    );
});

// Fetch 이벤트 - 캐시 우선, 네트워크 폴백
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API 요청은 항상 네트워크 사용
    if (url.pathname.startsWith('/api/') ||
        url.hostname.includes('supabase') ||
        event.request.method !== 'GET') {
        return;
    }

    // 정적 에셋: 캐시 우선
    if (isStaticAsset(url)) {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                const responseClone = networkResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, responseClone);
                                    });
                            }
                            return networkResponse;
                        })
                        .catch(() => {
                            console.warn('[SW] 오프라인, 캐시 없음:', url.pathname);
                            return new Response('Offline', { status: 503 });
                        });
                })
        );
    }
});

// 정적 에셋 여부 확인
function isStaticAsset(url) {
    const staticExtensions = [
        '.js', '.css', '.html',
        '.glb', '.gltf', '.obj', '.fbx',
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
        '.mp3', '.wav', '.ogg',
        '.woff', '.woff2', '.ttf', '.eot'
    ];

    const pathname = url.pathname.toLowerCase();
    return staticExtensions.some(ext => pathname.endsWith(ext)) ||
           pathname === '/' ||
           url.hostname.includes('cdnjs') ||
           url.hostname.includes('fonts.googleapis') ||
           url.hostname.includes('gstatic');
}

// 메시지 이벤트 - 캐시 상태 조회
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }

    if (event.data === 'getCacheStatus') {
        caches.open(CACHE_NAME)
            .then((cache) => cache.keys())
            .then((keys) => {
                event.ports[0].postMessage({
                    cached: keys.length,
                    total: ASSETS_TO_CACHE.length
                });
            });
    }
});
