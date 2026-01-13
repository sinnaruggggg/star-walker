# Multiplayer Storage Migration Work Log

## 작업 목표
멀티플레이어 모드에서 치팅 방지를 위해 게임 데이터를 localStorage에서 Supabase 서버로 이전

## 작업 범위

### 이전 대상 (5개)
| 키 | 데이터 | 위험도 | 상태 |
|---|---|---|---|
| `milkyway-ship-position-{mode}` | 우주선 위치/속도 | 심각 | ✅ 완료 |
| `milkyway-armory` | 무기고/장비 | 심각 | ✅ 완료 |
| `starwalker-missions` | 미션 진행 상황 | 심각 | ✅ 완료 |
| `ssilMissionState` | SSIL 훈련 미션 | 중간 | ✅ 완료 |
| `visitedStations` | 방문 기록 | 낮음 | ✅ 이미 Supabase 사용 중 |

### 유지 (로컬 OK - 8개)
- `milkyway-lang` - 언어 설정
- `cockpitUIPositions` - UI 위치
- `cockpitUISlots` - UI 슬롯
- `uiRearrangePositions` - UI 재배치
- `starwalker_visited` - 첫 방문 여부
- `starwalker_tutorial` - 튜토리얼 상태
- `milkyway-currentUser` - 로그인 세션
- `solar_user` - 로그인 세션

## 작업 원칙
1. **싱글플레이어 호환성 유지**: 싱글모드는 기존 localStorage 사용
2. **멀티플레이어만 서버 사용**: gameMode === 'multi' 일 때만 Supabase
3. **점진적 이전**: 한 기능씩 안전하게 이전
4. **기존 로직 보존**: 최소한의 변경으로 진행

---

## 완료된 작업

### 1. API 엔드포인트 생성
**파일**: `/api/gamedata.js`

- GET: 사용자 게임 데이터 조회
- POST: 게임 데이터 저장 (upsert)
- DELETE: 게임 데이터 삭제
- 데이터 유효성 검증 포함 (치팅 방지)
  - 위치 범위 검증 (태양계 범위 내)
  - 속도 제한 검증
  - 무기 개수 제한

### 2. GameDataManager 클래스 생성
**위치**: index.html (ShipPositionManager 바로 앞)

```javascript
const GameDataManager = {
    API_URL: '/api/gamedata',
    getUserId(),      // 현재 사용자 ID
    isMultiMode(),    // 멀티모드 여부
    save(dataType, data, localStorageKey),   // 저장 (멀티: 서버, 싱글: 로컬)
    load(dataType, localStorageKey),         // 로드 (멀티: 서버, 싱글: 로컬)
    delete(dataType, localStorageKey)        // 삭제
};
```

### 3. ShipPositionManager 수정
- `save()`: GameDataManager.save() 사용
- `load()`: 싱글모드 호환 유지, 멀티모드는 loadAsync 권장
- `loadAsync()`: 새로 추가 (멀티모드용)
- `clear()`: GameDataManager.delete() 사용
- `validateData()`: 데이터 검증 로직 분리

### 4. 무기고(Armory) 시스템 수정
- `loadArmoryFromServer()`: 새로 추가 (멀티모드 초기화용)
- `saveArmory()`: GameDataManager.save() 사용

### 5. 미션 시스템(MissionSystem) 수정
- `loadProgressAsync()`: 새로 추가 (멀티모드용)
- `initDefaultProgress()`: 기본 진행 상황 초기화 분리
- `saveProgress()`: GameDataManager.save() 사용

### 6. SSIL 미션 시스템 수정
- `loadSSILStateAsync()`: 새로 추가 (멀티모드용)
- `saveSSILState()`: GameDataManager.save() 사용

### 7. 멀티모드 초기화 코드 추가
**위치**: `startGameMode('multi')` 내부

```javascript
// 무기고, 미션, SSIL 미션 데이터 병렬 로드
await Promise.all([
    loadArmoryFromServer(),
    MissionSystem.loadProgressAsync(),
    loadSSILStateAsync()
]);
```

---

## Supabase 테이블 생성 SQL

**중요**: 아래 SQL을 Supabase SQL Editor에서 실행해야 합니다.

```sql
-- 게임 데이터 통합 테이블
CREATE TABLE IF NOT EXISTS user_game_data (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    data_type TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, data_type)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_game_data_user_id ON user_game_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_game_data_type ON user_game_data(data_type);

-- RLS (Row Level Security) 정책
ALTER TABLE user_game_data ENABLE ROW LEVEL SECURITY;

-- 사용자가 자신의 데이터만 접근 가능
CREATE POLICY "Users can access own data" ON user_game_data
    FOR ALL USING (auth.uid()::text = user_id OR user_id LIKE 'guest_%');

-- 익명 사용자도 자신의 게스트 데이터 접근 가능
CREATE POLICY "Anonymous users can access guest data" ON user_game_data
    FOR ALL USING (user_id LIKE 'guest_%');
```

---

## 데이터 타입별 저장 형식

### ship_position
```json
{
    "userId": "user123",
    "gameMode": "multi",
    "position": { "x": 100, "y": 0, "z": 200 },
    "rotation": { "x": 0, "y": 1.5, "z": 0 },
    "direction": { "x": 0, "y": 0, "z": -1 },
    "shipType": "shuttle",
    "fuel": 80,
    "speed": 50,
    "autopilot": { "engaged": true, "targetName": "Mars" },
    "timestamp": 1704067200000
}
```

### armory
```json
{
    "user123": {
        "ownedWeapons": ["laser_basic", "plasma_cannon"],
        "ownedArmors": ["steel_armor"],
        "equipped": {
            "shuttle": { "weapons": ["laser_basic"], "armor": "steel_armor" }
        }
    }
}
```

### missions
```json
{
    "mission_001": { "current": 5, "completed": true, "accepted": true },
    "mission_002": { "current": 2, "completed": false, "accepted": true }
}
```

### ssil_missions
```json
{
    "isFirstBoarding": false,
    "trainingCompleted": { "speed_1": true },
    "dailyMission": null,
    "missionPoints": 1500
}
```

---

## 작업 일시
- 2024-01-12: 전체 작업 완료

## 테스트 필요 항목
1. ✅ 싱글모드에서 기존 기능 정상 동작
2. 🔲 멀티모드에서 서버 저장/로드 동작
3. 🔲 네트워크 오류 시 로컬 폴백 동작
4. 🔲 데이터 유효성 검증 (치팅 방지)

---

## 관리자 페이지 - 무기/장갑/아이템 관리 (2024-01-13 추가)

### 추가된 기능
- ⚔️ 무기 관리 탭
- 🛡️ 장갑 관리 탭
- 📦 아이템 관리 탭

### Supabase 테이블 생성 SQL

```sql
-- ★★★ 무기 테이블 ★★★
CREATE TABLE IF NOT EXISTS weapons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier INTEGER DEFAULT 1,
    damage INTEGER DEFAULT 10,
    fire_rate DECIMAL(10,2) DEFAULT 1.0,
    range INTEGER DEFAULT 500,
    energy INTEGER DEFAULT 5,
    price INTEGER DEFAULT 0,
    description TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 무기 데이터 삽입
INSERT INTO weapons (id, name, tier, damage, fire_rate, range, energy, price, description) VALUES
('laser_basic', '기본 레이저', 1, 10, 2.0, 500, 5, 200, '가장 기본적인 레이저 무기'),
('laser_dual', '듀얼 레이저', 1, 18, 1.8, 500, 8, 400, '두 줄기 레이저 동시 발사'),
('machinegun', '우주 기관총', 1, 5, 8.0, 300, 2, 350, '빠른 연사 속도의 실탄 무기'),
('flare_launcher', '플레어 런처', 1, 15, 1.0, 200, 10, 300, '미사일 교란용 플레어'),
('laser_triple', '트리플 레이저', 2, 25, 1.5, 600, 12, 800, '세 줄기 레이저 동시 발사'),
('pulse_laser', '펄스 레이저', 2, 30, 3.0, 450, 15, 1000, '고속 펄스 에너지탄'),
('missile_basic', '기본 미사일', 2, 50, 0.5, 1000, 20, 1200, '유도 기능 없는 직선 미사일'),
('gatling', '개틀링건', 2, 8, 12.0, 350, 3, 1500, '초고속 회전 기관포'),
('shotgun', '스페이스 산탄총', 2, 40, 0.8, 150, 18, 900, '근거리 광역 피해'),
('beam_laser', '빔 레이저', 3, 45, 0.1, 800, 25, 3000, '지속 조사형 고출력 빔'),
('plasma_cannon', '플라즈마 캐논', 3, 60, 1.0, 600, 30, 3500, '고온 플라즈마 발사'),
('ion_cannon', '이온 캐논', 3, 35, 1.5, 700, 22, 2800, '적 시스템 마비 효과'),
('homing_missile', '호밍 미사일', 3, 70, 0.4, 1500, 35, 4000, '열추적 유도 미사일'),
('sniper_cannon', '스나이퍼 캐논', 3, 100, 0.3, 2000, 40, 4500, '초장거리 정밀 사격'),
('emp_missile', 'EMP 미사일', 3, 20, 0.3, 800, 45, 5000, '전자기 펄스로 시스템 마비'),
('railgun', '레일건', 4, 150, 0.2, 2500, 60, 8000, '전자기 가속 관통탄'),
('gauss_cannon', '가우스 캐논', 4, 120, 0.4, 1800, 50, 7000, '자기장 가속 중금속탄'),
('torpedo', '광자 어뢰', 4, 200, 0.15, 3000, 80, 10000, '대형 함선용 중어뢰'),
('cluster_missile', '클러스터 미사일', 4, 30, 0.5, 1200, 55, 9000, '분산 탄두 8발 동시 폭발'),
('tesla_coil', '테슬라 코일', 4, 80, 2.0, 400, 45, 8500, '연쇄 전기 방전'),
('disruptor', '디스럽터', 4, 90, 0.8, 600, 55, 9500, '실드 특화 파괴 무기'),
('antimatter_cannon', '반물질 캐논', 5, 300, 0.1, 2000, 100, 25000, '반물질 폭발로 광역 피해'),
('quantum_cannon', '양자 캐논', 5, 250, 0.15, 2500, 90, 22000, '양자 불확정성 관통'),
('nuke_missile', '핵 미사일', 5, 500, 0.05, 5000, 150, 30000, '전술 핵탄두 미사일'),
('gravity_well', '중력장 발생기', 5, 50, 0.2, 1000, 120, 28000, '중력장으로 적 속박'),
('mine_layer', '퀀텀 마인', 5, 180, 0.3, 100, 70, 20000, '공간에 기뢰 설치'),
('singularity_launcher', '특이점 발사기', 5, 400, 0.08, 1500, 130, 35000, '미니 블랙홀 생성'),
('darkmatter_beam', '암흑물질 빔', 5, 350, 0.1, 3000, 110, 32000, '암흑물질 에너지 방출'),
('tachyon_beam', '타키온 빔', 5, 280, 0.2, 4000, 95, 28000, '초광속 입자 빔'),
('omega_cannon', '오메가 캐논', 5, 1000, 0.02, 3500, 200, 50000, '최종 병기, 행성급 파괴력')
ON CONFLICT (id) DO NOTHING;

-- ★★★ 장갑 테이블 ★★★
CREATE TABLE IF NOT EXISTS armors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier INTEGER DEFAULT 1,
    defense INTEGER DEFAULT 50,
    hp_bonus INTEGER DEFAULT 100,
    weight DECIMAL(10,2) DEFAULT 1.0,
    price INTEGER DEFAULT 0,
    description TEXT,
    effect TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 장갑 데이터 삽입
INSERT INTO armors (id, name, tier, defense, hp_bonus, weight, price, description, effect) VALUES
('steel_armor', '강철 합금 장갑', 1, 50, 100, 1.0, 500, '기본적인 강철 합금 장갑판', NULL),
('titanium_armor', '강화 티타늄 장갑', 2, 100, 200, 0.9, 2000, '경량 고강도 티타늄 복합재', '이동속도 감소 10% 감면'),
('nanocarbon_armor', '나노카본 복합 장갑', 3, 180, 350, 0.7, 8000, '나노 탄소섬유 자가수복 장갑', '5초당 HP 1% 자동 회복'),
('energy_shield', '에너지 실드', 4, 280, 500, 0.5, 20000, '에너지 역장 방어막', '에너지 무기 피해 30% 감소'),
('quantum_barrier', '양자 분해 방어벽', 5, 500, 1000, 0.3, 50000, '양자 얽힘을 이용한 물질 분해 방어벽', '피해의 20%를 적에게 반사, 일정 확률로 피해 완전 무효화')
ON CONFLICT (id) DO NOTHING;

-- ★★★ 아이템 테이블 ★★★
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'consumable',
    price INTEGER DEFAULT 0,
    max_stack INTEGER DEFAULT 99,
    rarity TEXT DEFAULT 'common',
    description TEXT,
    effect JSONB,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 아이템 데이터 삽입
INSERT INTO items (id, name, category, price, max_stack, rarity, description, effect) VALUES
('fuel_pack_s', '연료팩 (소)', 'consumable', 100, 20, 'common', '연료 50 회복', '{"fuel": 50}'),
('fuel_pack_m', '연료팩 (중)', 'consumable', 250, 10, 'uncommon', '연료 150 회복', '{"fuel": 150}'),
('fuel_pack_l', '연료팩 (대)', 'consumable', 500, 5, 'rare', '연료 완전 회복', '{"fuel": 999}'),
('repair_kit_s', '수리킷 (소)', 'consumable', 150, 20, 'common', 'HP 100 회복', '{"hp": 100}'),
('repair_kit_m', '수리킷 (중)', 'consumable', 400, 10, 'uncommon', 'HP 300 회복', '{"hp": 300}'),
('repair_kit_l', '수리킷 (대)', 'consumable', 800, 5, 'rare', 'HP 완전 회복', '{"hp": 9999}'),
('speed_boost', '속도 부스터', 'consumable', 300, 10, 'uncommon', '30초간 속도 50% 증가', '{"speedBoost": 1.5, "duration": 30}'),
('shield_boost', '쉴드 강화제', 'consumable', 500, 10, 'rare', '30초간 받는 피해 50% 감소', '{"damageReduce": 0.5, "duration": 30}'),
('scan_amplifier', '스캔 증폭기', 'upgrade', 2000, 1, 'rare', '스캔 범위 2배 증가', '{"scanRange": 2}'),
('fuel_tank_upgrade', '연료탱크 확장', 'upgrade', 5000, 1, 'epic', '최대 연료 50% 증가', '{"maxFuel": 1.5}'),
('engine_booster', '엔진 부스터', 'upgrade', 8000, 1, 'epic', '최대 속도 20% 증가', '{"maxSpeed": 1.2}'),
('scrap_metal', '고철', 'material', 10, 999, 'common', '우주선 수리용 기본 재료', NULL),
('energy_crystal', '에너지 결정', 'material', 100, 99, 'uncommon', '에너지 무기 강화 재료', NULL),
('dark_matter', '암흑물질', 'material', 1000, 10, 'legendary', '최고급 강화 재료', NULL)
ON CONFLICT (id) DO NOTHING;

-- RLS 정책 (공개 읽기)
ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE armors ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weapons" ON weapons FOR SELECT USING (true);
CREATE POLICY "Anyone can read armors" ON armors FOR SELECT USING (true);
CREATE POLICY "Anyone can read items" ON items FOR SELECT USING (true);

-- 관리자만 수정 가능 (Supabase Dashboard에서 직접 수정하거나 service_role 키 사용)
CREATE POLICY "Admin can modify weapons" ON weapons FOR ALL USING (true);
CREATE POLICY "Admin can modify armors" ON armors FOR ALL USING (true);
CREATE POLICY "Admin can modify items" ON items FOR ALL USING (true);
```

---

## 우주선 적재량(capacity) 시스템 추가 (2024-01-13)

### 기능 설명
- 각 우주선에 적재량(capacity) 값 추가
- 무기에 무게(weight) 값 추가
- 장갑의 무게는 기본 30 × weight 계수로 계산
- 장비 장착 시 적재량 초과 체크
- 무장 시스템 UI에 적재량 바 표시

### 우주선별 적재량 (기본값)
| 우주선 | 적재량 |
|--------|--------|
| 셔틀 | 50 |
| 탐사정 | 60 |
| 인터셉터 | 70 |
| 화물선 | 200 |
| 코르벳 | 120 |
| 레이서 | 60 |
| 프리깃 | 150 |
| 크루저 | 180 |
| 배틀십 | 250 |
| 플래그십 | 300 |

### Supabase SQL (ships 테이블에 capacity 컬럼 추가)

```sql
-- ships 테이블에 capacity 컬럼 추가
ALTER TABLE ships ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 100;

-- 기존 우주선에 적재량 값 설정
UPDATE ships SET capacity = 50 WHERE id = 'shuttle';
UPDATE ships SET capacity = 60 WHERE id = 'scout';
UPDATE ships SET capacity = 70 WHERE id = 'interceptor';
UPDATE ships SET capacity = 200 WHERE id = 'freighter';
UPDATE ships SET capacity = 120 WHERE id = 'corvette';
UPDATE ships SET capacity = 60 WHERE id = 'racer';
UPDATE ships SET capacity = 150 WHERE id = 'frigate';
UPDATE ships SET capacity = 180 WHERE id = 'cruiser';
UPDATE ships SET capacity = 250 WHERE id = 'battleship';
UPDATE ships SET capacity = 300 WHERE id = 'flagship';
```

### 무기 무게 테이블
| Tier | 무게 범위 |
|------|-----------|
| 1 | 5-8 |
| 2 | 10-18 |
| 3 | 15-28 |
| 4 | 25-45 |
| 5 | 40-80 |

### 장갑 무게 계산
- 기본 무게: 30
- 실제 무게 = 30 × weight 계수
- 예: 양자 분해 방어벽 (weight: 0.3) → 무게 9
