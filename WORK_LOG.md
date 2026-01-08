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
- 원인 추정: 스케일 불일치 (플레이어 우주선 0.08 스케일 vs 다른 플레이어 메시 크기)

#### 테스트 시도 (2024-01-06)
1. **첫 번째 시도**: 200 단위 거리 테스트 → 결과 대기 중
2. **두 번째 시도**: 메시 크기 및 거리 조정
   - 메시 크기: `ConeGeometry(0.1, 0.3)` + `SphereGeometry(0.15)` 글로우
   - 테스트 거리: 0.5 단위 (우주선 바로 옆)
   - 색상: 초록색 (#00ff00) - 내 우주선과 구분

```javascript
// 현재 테스트 코드 (mpInterpolateOtherPlayers 내부)
const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(myShip.mesh.quaternion);
const right = new THREE.Vector3(1, 0, 0).applyQuaternion(myShip.mesh.quaternion);
const testPos = myShip.mesh.position.clone()
    .add(right.multiplyScalar(0.5))  // 오른쪽 0.5 단위
    .add(forward.multiplyScalar(0.3));  // 전방 0.3 단위
ship.mesh.position.copy(testPos);
```

#### 해결: 테스트 성공 후 실제 구현 완료 (2024-01-06)

**원인**: 좌표 스케일이 매우 작음 (0.5 단위 = 바로 옆, 2000 단위 = 매우 멀리)

**구현 내용**:
1. `createOtherPlayerShip` 완전 재작성
   - SHIP_TYPES에서 ship_type으로 우주선 타입 찾기
   - GLTFLoader로 GLB 모델 로드 (실패 시 기본 콘 형태)
   - 플레이어 우주선과 동일한 스케일 (0.08) 적용
   - CSS2DObject로 닉네임 레이블 표시

2. `mpInterpolateOtherPlayers` 수정
   - 테스트 코드 제거
   - 실제 DB 좌표 사용
   - 위치/회전 부드러운 보간

3. `addFallbackGeometry` 함수 추가
   - GLB 로드 실패 시 기본 형태 생성

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

---

## 2024-01-07 작업 내용

### 문제: 멀티플레이어 우주선이 꼬깔(Cone) 형태로만 표시됨

#### 원인 분석
1. `SHIP_TYPES` 배열이 함수 스코프 내에 정의되어 전역 접근 불가
2. `GLTFLoader`가 ES6 모듈로 import되어 `window.GLTFLoader`로 접근 불가
3. `createOtherPlayerShip`에서 `typeof SHIP_TYPES !== 'undefined'` 체크 실패
4. GLB 모델 로드 조건문 통과 못하여 기본 Cone 형태만 표시

#### 수정 내용
1. **SHIP_TYPES 전역 노출** (index.html:11141)
   ```javascript
   window.SHIP_TYPES = SHIP_TYPES;
   ```

2. **GLTFLoader 전역 노출** (index.html:8658)
   ```javascript
   window.GLTFLoader = GLTFLoader;
   ```

3. **CSS2DObject 전역 노출** (index.html:8659)
   ```javascript
   window.CSS2DObject = CSS2DObject;
   ```

4. **createOtherPlayerShip에서 window 접근으로 변경**
   - `SHIP_TYPES` → `window.SHIP_TYPES`
   - `CSS2DObject` → `window.CSS2DObject`

5. **렌더링 순서 문제 해결**
   - 문제: 다른 플레이어 우주선이 내 조종실 안에 렌더링됨
   - 해결: `shipGroup.renderOrder = -100` 설정
   - material에 `depthWrite: true`, `depthTest: true` 명시

6. **라디오 아이콘 모서리 둥글게**
   - 문제: collapsed 상태에서 clip-path로 인해 각진 모서리
   - 해결: `#cockpit-radio.collapsed`에 `clip-path: none` 추가

#### 리소스 경로 정리

**행성 텍스처** - Supabase Storage `assets/`:
```
https://sfirzuqngdbpwvdoyero.supabase.co/storage/v1/object/public/assets/
├── earth_1765901958.jpeg
├── mars_1765902547.jpg
├── venus_1765902007.jpg
├── saturn_1765902576.jpg
├── jupiter_1765902587.jpg
├── mercury_1765902026.jpg
├── moon_1765907677.jpg
├── neptune_1765907700.jpeg
├── uranus_1765903664.jpg
└── saturn_ring_1765903886.png
```

**GLB 우주선 모델** - Supabase Storage `assets/ships/`:
```
https://sfirzuqngdbpwvdoyero.supabase.co/storage/v1/object/public/assets/ships/
├── shuttle_model_1767450908791.glb
├── explorer_model_1766457987.glb
├── interceptor_model_1765905786.glb
└── freighter_model_1765906618.glb
```

#### 남은 작업
- [ ] 중복 접속 감지 및 강제 로그아웃 구현
