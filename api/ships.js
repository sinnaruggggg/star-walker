// Vercel Serverless Function - Ships API
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
        // GET - 모든 우주선 조회
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('ships')
                .select('*')
                .order('tier', { ascending: true });

            if (error) throw error;

            // 클라이언트 호환 형식으로 변환
            const ships = data.map(ship => ({
                id: ship.id,
                name: ship.name,
                nameEn: ship.name_en,
                tier: ship.tier,
                maxSpeed: ship.max_speed,
                acceleration: parseFloat(ship.acceleration),
                turnSpeed: parseFloat(ship.turn_speed),
                maxFuel: ship.max_fuel,
                size: ship.size,
                color: ship.color,
                special: ship.special,
                description: ship.description,
                unlocked: ship.unlocked,
                price: ship.price,
                image: ship.image,
                model: ship.model,
                engineConfig: ship.engine_config
            }));

            return res.status(200).json(ships);
        }

        // POST - 우주선 추가/수정
        if (req.method === 'POST') {
            const ship = req.body;

            const dbShip = {
                id: ship.id,
                name: ship.name,
                name_en: ship.nameEn,
                tier: ship.tier,
                max_speed: ship.maxSpeed,
                acceleration: ship.acceleration,
                turn_speed: ship.turnSpeed,
                max_fuel: ship.maxFuel,
                size: ship.size,
                color: ship.color,
                special: ship.special,
                description: ship.description,
                unlocked: ship.unlocked,
                price: ship.price,
                image: ship.image,
                model: ship.model,
                engine_config: ship.engineConfig
            };

            const { data, error } = await supabase
                .from('ships')
                .upsert(dbShip, { onConflict: 'id' })
                .select();

            if (error) throw error;
            return res.status(200).json({ success: true, data });
        }

        // PUT - 우주선 수정
        if (req.method === 'PUT') {
            const { id, ...updates } = req.body;

            const dbUpdates = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.nameEn !== undefined) dbUpdates.name_en = updates.nameEn;
            if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
            if (updates.maxSpeed !== undefined) dbUpdates.max_speed = updates.maxSpeed;
            if (updates.acceleration !== undefined) dbUpdates.acceleration = updates.acceleration;
            if (updates.turnSpeed !== undefined) dbUpdates.turn_speed = updates.turnSpeed;
            if (updates.maxFuel !== undefined) dbUpdates.max_fuel = updates.maxFuel;
            if (updates.size !== undefined) dbUpdates.size = updates.size;
            if (updates.color !== undefined) dbUpdates.color = updates.color;
            if (updates.special !== undefined) dbUpdates.special = updates.special;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.unlocked !== undefined) dbUpdates.unlocked = updates.unlocked;
            if (updates.price !== undefined) dbUpdates.price = updates.price;
            if (updates.image !== undefined) dbUpdates.image = updates.image;
            if (updates.model !== undefined) dbUpdates.model = updates.model;
            if (updates.engineConfig !== undefined) dbUpdates.engine_config = updates.engineConfig;

            const { data, error } = await supabase
                .from('ships')
                .update(dbUpdates)
                .eq('id', id)
                .select();

            if (error) throw error;
            return res.status(200).json({ success: true, data });
        }

        // DELETE - 우주선 삭제
        if (req.method === 'DELETE') {
            const { id } = req.body;

            const { error } = await supabase
                .from('ships')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Ships API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
