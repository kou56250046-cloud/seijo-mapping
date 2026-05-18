import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { membersToCsv } from '@/lib/csv';
import type { Member } from '@/types/member';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = membersToCsv(data as Member[]);
  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="members_${date}.csv"`,
    },
  });
}
