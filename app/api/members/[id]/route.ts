import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocode';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await request.json();

  let { lat, lng } = body;
  if ((!lat || !lng) && body.address) {
    const geo = await geocodeAddress(body.address);
    if (geo) { lat = geo.lat; lng = geo.lng; }
  }

  const { data, error } = await supabase
    .from('members')
    .update({ ...body, lat, lng, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
