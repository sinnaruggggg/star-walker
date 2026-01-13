// Vercel Serverless Function - Game Data API
// 멀티플레이어 모드에서 게임 데이터를 서버에 저장/로드
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { userId, dataType } = req.query;

        // userId 필수 검증
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // GET - 게임 데이터 조회
        if (req.method === 'GET') {
            let query = supabase
                .from('user_game_data')
                .select('*')
                .eq('user_id', userId);

            // 특정 데이터 타입만 조회
            if (dataType) {
                query = query.eq('data_type', dataType);
            }

            const { data, error } = await query;

            if (error) throw error;

            // 데이터 타입별로 정리하여 반환
            const result = {};
            data.forEach(item => {
                result[item.data_type] = item.data;
            });

            return res.status(200).json(result);
        }

        // POST - 게임 데이터 저장 (upsert)
        if (req.method === 'POST') {
            const { dataType: bodyDataType, data } = req.body;

            if (!bodyDataType || data === undefined) {
                return res.status(400).json({ error: 'dataType and data are required' });
            }

            // 유효한 데이터 타입 검증
            const validTypes = ['ship_position', 'armory', 'missions', 'ssil_missions', 'visited_stations'];
            if (!validTypes.includes(bodyDataType)) {
                return res.status(400).json({ error: 'Invalid dataType' });
            }

            // 데이터 유효성 검증 (치팅 방지 기본)
            const validationResult = validateGameData(bodyDataType, data);
            if (!validationResult.valid) {
                return res.status(400).json({ error: validationResult.error });
            }

            const { data: result, error } = await supabase
                .from('user_game_data')
                .upsert({
                    user_id: userId,
                    data_type: bodyDataType,
                    data: data,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,data_type'
                })
                .select();

            if (error) throw error;
            return res.status(200).json({ success: true, data: result });
        }

        // DELETE - 게임 데이터 삭제
        if (req.method === 'DELETE') {
            const { dataType: bodyDataType } = req.body;

            let query = supabase
                .from('user_game_data')
                .delete()
                .eq('user_id', userId);

            if (bodyDataType) {
                query = query.eq('data_type', bodyDataType);
            }

            const { error } = await query;

            if (error) throw error;
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('GameData API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

// 데이터 유효성 검증 함수
function validateGameData(dataType, data) {
    switch (dataType) {
        case 'ship_position':
            // 위치 범위 검증 (태양계 범위 내)
            if (data.position) {
                const maxRange = 100000; // 태양계 최대 범위
                const pos = data.position;
                if (Math.abs(pos.x) > maxRange || Math.abs(pos.y) > maxRange || Math.abs(pos.z) > maxRange) {
                    return { valid: false, error: 'Position out of bounds' };
                }
            }
            // 속도 제한 검증
            if (data.velocity) {
                const maxSpeed = 100; // 최대 속도
                const vel = data.velocity;
                const speed = Math.sqrt(vel.x*vel.x + vel.y*vel.y + vel.z*vel.z);
                if (speed > maxSpeed) {
                    return { valid: false, error: 'Velocity exceeds maximum' };
                }
            }
            break;

        case 'armory':
            // 무기 개수 제한
            if (data.weapons && data.weapons.length > 20) {
                return { valid: false, error: 'Too many weapons' };
            }
            break;

        case 'missions':
            // 미션 보상 조작 방지 (서버에서 실제 보상 지급)
            // 클라이언트는 진행 상태만 저장
            break;

        case 'ssil_missions':
            // SSIL 미션 상태 검증
            break;

        case 'visited_stations':
            // 방문 기록은 배열이어야 함
            if (!Array.isArray(data)) {
                return { valid: false, error: 'visited_stations must be an array' };
            }
            if (data.length > 1000) {
                return { valid: false, error: 'Too many visited stations' };
            }
            break;
    }

    return { valid: true };
}
