-- ============================================
-- Solar Explorer - Supabase Schema
-- 닷홈 → Vercel + Supabase 마이그레이션
-- ============================================

-- 1. 우주선 테이블
CREATE TABLE IF NOT EXISTS ships (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    tier INTEGER DEFAULT 1,
    max_speed INTEGER DEFAULT 100,
    acceleration NUMERIC(4,2) DEFAULT 1.0,
    turn_speed NUMERIC(4,3) DEFAULT 0.1,
    max_fuel INTEGER DEFAULT 300,
    size TEXT DEFAULT 'small' CHECK (size IN ('small', 'medium', 'large', 'huge')),
    color TEXT DEFAULT '4fc3f7',
    special TEXT DEFAULT '',
    description TEXT DEFAULT '',
    unlocked BOOLEAN DEFAULT false,
    price INTEGER DEFAULT 0,
    image TEXT DEFAULT '',
    model TEXT DEFAULT '',
    engine_config JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 천체 데이터 테이블
CREATE TABLE IF NOT EXISTS celestial_bodies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    radius NUMERIC(10,2) DEFAULT 1.0,
    mass NUMERIC(15,2) DEFAULT 1.0,
    color TEXT DEFAULT '0xffffff',
    tex_type TEXT DEFAULT 'rock',
    tex_key TEXT DEFAULT '',
    body_type TEXT DEFAULT 'planet',
    rot_speed NUMERIC(6,4) DEFAULT 0.0,
    ring BOOLEAN DEFAULT false,
    emissive TEXT DEFAULT NULL,
    parent TEXT DEFAULT NULL,
    orbit_radius NUMERIC(10,2) DEFAULT NULL,
    orbit_speed NUMERIC(8,4) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 게임 설정 테이블 (bgm_config 등)
CREATE TABLE IF NOT EXISTS game_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 적용
DROP TRIGGER IF EXISTS ships_updated_at ON ships;
CREATE TRIGGER ships_updated_at
    BEFORE UPDATE ON ships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS celestial_bodies_updated_at ON celestial_bodies;
CREATE TRIGGER celestial_bodies_updated_at
    BEFORE UPDATE ON celestial_bodies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 6. RLS (Row Level Security) 설정
ALTER TABLE ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE celestial_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_config ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "ships_read_all" ON ships FOR SELECT USING (true);
CREATE POLICY "celestial_read_all" ON celestial_bodies FOR SELECT USING (true);
CREATE POLICY "config_read_all" ON game_config FOR SELECT USING (true);

-- 인증된 사용자만 수정 가능 (admin 체크는 애플리케이션에서)
CREATE POLICY "ships_write_auth" ON ships FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "celestial_write_auth" ON celestial_bodies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "config_write_auth" ON game_config FOR ALL USING (auth.role() = 'authenticated');

-- 7. 플레이어 위치 테이블 (멀티플레이어)
CREATE TABLE IF NOT EXISTS player_positions (
    user_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL DEFAULT '익명',
    x NUMERIC(20,6) NOT NULL DEFAULT 0,
    y NUMERIC(20,6) NOT NULL DEFAULT 0,
    z NUMERIC(20,6) NOT NULL DEFAULT 0,
    rot_x NUMERIC(10,6) NOT NULL DEFAULT 0,
    rot_y NUMERIC(10,6) NOT NULL DEFAULT 0,
    rot_z NUMERIC(10,6) NOT NULL DEFAULT 0,
    ship_type TEXT DEFAULT 'shuttle',
    current_body TEXT DEFAULT NULL,
    speed NUMERIC(10,2) DEFAULT 0,
    dir_x NUMERIC(10,6) DEFAULT 0,
    dir_y NUMERIC(10,6) DEFAULT 0,
    dir_z NUMERIC(10,6) DEFAULT -1,
    is_autopilot BOOLEAN DEFAULT false,
    autopilot_target TEXT DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 플레이어 위치 RLS
ALTER TABLE player_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_positions_read_all" ON player_positions FOR SELECT USING (true);
CREATE POLICY "player_positions_write_all" ON player_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "player_positions_update_all" ON player_positions FOR UPDATE USING (true);
CREATE POLICY "player_positions_delete_all" ON player_positions FOR DELETE USING (true);

-- 플레이어 위치 인덱스
CREATE INDEX IF NOT EXISTS idx_player_positions_updated ON player_positions(updated_at);

-- 8. 채팅 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅 RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_read_all" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_write_all" ON chat_messages FOR INSERT WITH CHECK (true);

-- 채팅 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);

-- 9. 방문 기록 테이블
CREATE TABLE IF NOT EXISTS visited_bodies (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    body_name TEXT NOT NULL,
    last_visited_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, body_name)
);

-- 방문 기록 RLS
ALTER TABLE visited_bodies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visited_read_all" ON visited_bodies FOR SELECT USING (true);
CREATE POLICY "visited_write_all" ON visited_bodies FOR INSERT WITH CHECK (true);
CREATE POLICY "visited_update_all" ON visited_bodies FOR UPDATE USING (true);

-- 방문 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_visited_user ON visited_bodies(user_id);

-- 10. 서버 시간 조회 함수 (멀티플레이어 동기화용)
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN NOW();
END;
$$ LANGUAGE plpgsql;

-- 11. 기존 인덱스
CREATE INDEX IF NOT EXISTS idx_ships_tier ON ships(tier);
CREATE INDEX IF NOT EXISTS idx_ships_unlocked ON ships(unlocked);
CREATE INDEX IF NOT EXISTS idx_celestial_type ON celestial_bodies(body_type);
CREATE INDEX IF NOT EXISTS idx_celestial_parent ON celestial_bodies(parent);
