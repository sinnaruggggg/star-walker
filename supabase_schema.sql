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

-- 7. 인덱스
CREATE INDEX IF NOT EXISTS idx_ships_tier ON ships(tier);
CREATE INDEX IF NOT EXISTS idx_ships_unlocked ON ships(unlocked);
CREATE INDEX IF NOT EXISTS idx_celestial_type ON celestial_bodies(body_type);
CREATE INDEX IF NOT EXISTS idx_celestial_parent ON celestial_bodies(parent);
