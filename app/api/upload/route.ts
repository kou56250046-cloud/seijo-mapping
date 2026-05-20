import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import sharp from 'sharp';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'JPEG/PNG/WebP/GIF のみ対応しています' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const resized = await sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toBuffer();

  const fileName = `${crypto.randomUUID()}.jpg`;
  const supabase = createServerClient();

  const { data, error } = await supabase.storage
    .from('member-photos')
    .upload(fileName, resized, { contentType: 'image/jpeg' });

  if (error) return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from('member-photos')
    .getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}
