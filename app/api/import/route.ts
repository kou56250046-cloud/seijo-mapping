import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseCsv } from '@/lib/csv';
import { geocodeWithDelay } from '@/lib/geocode';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const mode = (formData.get('mode') as string) || 'append';

  if (!file) {
    return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
  }

  const csvText = await file.text();
  const members = parseCsv(csvText);

  if (members.length === 0) {
    return NextResponse.json({ error: 'インポートできるデータがありません' }, { status: 400 });
  }

  if (mode === 'replace') {
    await supabase.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const results = { success: 0, failed: 0, total: members.length, errors: [] as string[] };

  for (const member of members) {
    try {
      const geo = await geocodeWithDelay(member.address);
      const { error } = await supabase.from('members').insert({
        ...member,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
      });

      if (error) {
        results.failed++;
        results.errors.push(`${member.name}: ${error.message}`);
      } else {
        results.success++;
      }
    } catch {
      results.failed++;
      results.errors.push(`${member.name}: 予期しないエラー`);
    }
  }

  return NextResponse.json(results);
}
