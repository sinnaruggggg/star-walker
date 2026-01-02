// Vercel Serverless Function - Celestial Bodies API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - 모든 천체 조회
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('celestial_bodies')
                .select('*')
                .order('id');

            if (error) throw error;

            // data.json 호환 형식으로 변환 (객체 형태)
            const bodies = {};
            data.forEach(body => {
                bodies[body.id] = {
                    r: parseFloat(body.radius),
                    m: parseFloat(body.mass),
                    color: body.color,
                    texType: body.tex_type,
                    texKey: body.tex_key,
                    type: body.body_type,
                    rotSpeed: parseFloat(body.rot_speed) || undefined,
                    ring: body.ring || undefined,
                    emissive: body.emissive || undefined
                };
                // undefined 값 제거
                Object.keys(bodies[body.id]).forEach(key => {
                    if (bodies[body.id][key] === undefined) {
                        delete bodies[body.id][key];
                    }
                });
            });

            return res.status(200).json(bodies);
        }

        // POST - 천체 추가/수정
        if (req.method === 'POST') {
            const { id, ...body } = req.body;

            const dbBody = {
                id: id,
                name: body.name || id,
                name_en: body.nameEn || id,
                radius: body.r,
                mass: body.m,
                color: body.color,
                tex_type: body.texType,
                tex_key: body.texKey || '',
                body_type: body.type,
                rot_speed: body.rotSpeed || 0,
                ring: body.ring || false,
                emissive: body.emissive || null
            };

            const { data, error } = await supabase
                .from('celestial_bodies')
                .upsert(dbBody, { onConflict: 'id' })
                .select();

            if (error) throw error;
            return res.status(200).json({ success: true, data });
        }

        // DELETE - 천체 삭제
        if (req.method === 'DELETE') {
            const { id } = req.body;

            const { error } = await supabase
                .from('celestial_bodies')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Celestial API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
