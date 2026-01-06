# Solar Explorer 작업 기록

## 2024-01-06 작업 내용

### 문제: 멀티플레이어에서 다른 유저가 안 보임

#### 시도한 해결책들

1. **세션 ID 시스템 도입 (실패)**
   - 같은 계정 여러 기기 접속 시 서로 안 보이는 문제 해결 시도
   - `generateSessionId()` 함수로 `user_id + timestamp + random` 형식 생성
   - DB의 `user_id`가 UUID 타입이라 400 에러 발생
   - 순수 UUID 형식으로 변경했으나 RLS 정책 위반 에러 발생
   - **롤백함**: 원래 `user_id` 사용으로 복원

2. **디버깅 로그 추가**
   - `updateOtherPlayers` 함수에 상세 로그 추가
   - 결과: `mpOtherPlayers`에 플레이어가 이미 등록되어 있음
   - `createOtherPlayerShip`이 호출되어 메시가 생성되었으나 화면에 안 보임

#### 현재 상태
- 플레이어 조회: 정상 작동 (다른 플레이어 1명 발견)
- `mpOtherPlayers` 객체: 플레이어 등록됨
- 문제: **우주선 메시가 생성되었으나 화면에 보이지 않음**

#### 의심되는 원인
1. 우주선 크기가 너무 작음 (`ConeGeometry(0.3, 1, 8)`)
2. 카메라 거리 대비 메시가 너무 작아서 안 보임
3. 플레이어 위치: x: 9774, z: 5317 / 나: x: 10511, z: 3502 (거리 ~2000)

#### 수정 내용
- [x] 우주선 메시 크기 확대: `ConeGeometry(0.3, 1, 8)` → `ConeGeometry(50, 150, 8)`
- [x] 글로우 크기 확대: `SphereGeometry(0.5)` → `SphereGeometry(80)` (빨간색)
- [x] PointLight 추가 (빨간색, 강도 1, 거리 500)
- [ ] 중복 접속 감지 및 강제 로그아웃 구현

#### 추가 문제: 다른 플레이어가 멀리 보임 (좌표는 가까운데)
- 좌표상 거리 ~2000인데 화면에서는 훨씬 멀리 보임
- **테스트**: `mpInterpolateOtherPlayers`에서 강제로 내 옆 200 거리에 배치하는 코드 추가
- 테스트 목적: Floating Origin 문제인지 좌표 문제인지 구분

```javascript
// 테스트 코드 (mpInterpolateOtherPlayers 내부)
const testPos = new THREE.Vector3(
    myShip.mesh.position.x + 200,  // 내 옆 200 거리
    myShip.mesh.position.y,
    myShip.mesh.position.z
);
ship.mesh.position.lerp(testPos, lerpFactor);
```

---

### 관련 코드 위치

- **멀티플레이어 변수**: `index.html:27437-27451`
- **위치 전송**: `mpSendMyPosition()` - `index.html:28526`
- **플레이어 조회**: `mpGetOtherPlayers()` - `index.html:28613`
- **플레이어 업데이트**: `updateOtherPlayers()` - `index.html:28674`
- **우주선 생성**: `createOtherPlayerShip()` - `index.html:28717` (추정)
- **Realtime 구독**: `setupRealtimeSubscription()` - `index.html:28970`

### DB 스키마
- 테이블: `player_positions`
- PRIMARY KEY: `user_id` (UUID 타입)
- 주요 컬럼: `x`, `y`, `z`, `rot_x`, `rot_y`, `rot_z`, `nickname`, `ship_type`, `ship_color`, `status`
