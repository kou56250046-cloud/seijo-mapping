import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocode';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();

  let { lat, lng } = body;
  if ((!lat || !lng) && body.address) {
    const geo = await geocodeAddress(body.address);
    if (geo) { lat = geo.lat; lng = geo.lng; }
  }

  const { data, error } = await supabase
    .from('members')
    .insert({ ...body, lat, lng })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
