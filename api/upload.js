// Vercel Serverless Function - File Upload API (Supabase Storage)
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false, // formidable을 위해 비활성화
    },
};

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Storage 접근에는 service key 필요
);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const form = formidable({
            maxFileSize: 50 * 1024 * 1024, // 50MB 제한
        });

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        const file = files.file?.[0] || files.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const folder = fields.folder?.[0] || fields.folder || 'uploads';
        const timestamp = Date.now();
        const originalName = file.originalFilename || 'file';
        const ext = originalName.split('.').pop();
        const fileName = `${originalName.replace(/\.[^/.]+$/, '')}_${timestamp}.${ext}`;
        const filePath = `${folder}/${fileName}`;

        // 파일 읽기
        const fileBuffer = fs.readFileSync(file.filepath);

        // Supabase Storage에 업로드
        const { data, error } = await supabase.storage
            .from('game-assets') // 버킷 이름
            .upload(filePath, fileBuffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) throw error;

        // 공개 URL 생성
        const { data: urlData } = supabase.storage
            .from('game-assets')
            .getPublicUrl(filePath);

        // 임시 파일 삭제
        fs.unlinkSync(file.filepath);

        return res.status(200).json({
            success: true,
            url: urlData.publicUrl,
            path: filePath
        });

    } catch (error) {
        console.error('Upload Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
