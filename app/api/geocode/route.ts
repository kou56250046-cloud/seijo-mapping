import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocode';

export async function POST(request: NextRequest) {
  const { id, address } = await request.json();
  if (!id || !address) {
    return NextResponse.json({ error: 'id と address が必要です' }, { status: 400 });
  }

  const geo = await geocodeAddress(address);
  if (!geo) {
    return NextResponse.json({ success: false, message: '座標が取得できませんでした' });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from('members')
    .update({ lat: geo.lat, lng: geo.lng })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, lat: geo.lat, lng: geo.lng });
}
