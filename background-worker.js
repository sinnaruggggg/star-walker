// Solar Explorer - Background Position Worker
// 백그라운드에서 우주선 위치 계산

let state = {
    active: false,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    speed: 0,
    direction: { x: 0, y: 0, z: -1 },
    lastUpdate: Date.now(),
    autopilot: {
        engaged: false,
        targetPosition: null,
        targetName: null
    }
};

let updateInterval = null;

// 메시지 수신
self.onmessage = function(e) {
    const { type, data } = e.data;

    switch (type) {
        case 'start':
            startTracking(data);
            break;
        case 'stop':
            stopTracking();
            break;
        case 'update':
            updateState(data);
            break;
        case 'getState':
            self.postMessage({ type: 'state', data: state });
            break;
    }
};

function startTracking(data) {
    if (data) {
        state.position = data.position || state.position;
        state.velocity = data.velocity || state.velocity;
        state.speed = data.speed || 0;
        state.direction = data.direction || state.direction;
        state.autopilot = data.autopilot || state.autopilot;
    }

    state.active = true;
    state.lastUpdate = Date.now();

    // 100ms마다 위치 업데이트
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updatePosition, 100);

    console.log('[Worker] 백그라운드 추적 시작');
}

function stopTracking() {
    state.active = false;
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    console.log('[Worker] 백그라운드 추적 중지');
}

function updateState(data) {
    if (data.position) state.position = data.position;
    if (data.velocity) state.velocity = data.velocity;
    if (data.speed !== undefined) state.speed = data.speed;
    if (data.direction) state.direction = data.direction;
    if (data.autopilot) state.autopilot = data.autopilot;
    state.lastUpdate = Date.now();
}

function updatePosition() {
    if (!state.active || state.speed < 0.1) return;

    const now = Date.now();
    const deltaTime = (now - state.lastUpdate) / 1000; // 초 단위
    state.lastUpdate = now;

    // 최대 델타 타임 제한 (1초)
    const dt = Math.min(deltaTime, 1.0);

    if (state.autopilot.engaged && state.autopilot.targetPosition) {
        // 자동항법 모드: 목표 방향으로 이동
        const target = state.autopilot.targetPosition;
        const dx = target.x - state.position.x;
        const dy = target.y - state.position.y;
        const dz = target.z - state.position.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (dist > 10) {
            // 목표 방향으로 이동
            const moveAmount = state.speed * dt;
            const ratio = moveAmount / dist;

            state.position.x += dx * ratio;
            state.position.y += dy * ratio;
            state.position.z += dz * ratio;

            // 방향 업데이트
            state.direction.x = dx / dist;
            state.direction.y = dy / dist;
            state.direction.z = dz / dist;
        } else {
            // 목표 도착
            state.speed = Math.max(state.speed - 10 * dt, 0);
        }
    } else {
        // 수동 비행 모드: 현재 방향으로 이동
        const moveAmount = state.speed * dt;
        state.position.x += state.direction.x * moveAmount;
        state.position.y += state.direction.y * moveAmount;
        state.position.z += state.direction.z * moveAmount;
    }

    // 메인 스레드에 위치 전송 (1초마다)
    if (Math.random() < 0.1) { // 약 10%의 틱에서만 전송 (성능 최적화)
        self.postMessage({
            type: 'positionUpdate',
            data: {
                position: state.position,
                speed: state.speed,
                direction: state.direction,
                timestamp: now
            }
        });
    }
}
