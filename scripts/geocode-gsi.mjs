// 国土地理院APIで未ジオコーディングメンバーの座標を一括取得
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function normalizeAddress(address) {
  return address
    .replace(/[\n\r\t]/g, ' ')
    .replace(/〒/g, '')
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 0x30))
    .replace(/[１-９Ａ-Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[－ーｰ−–—━～]/g, '-')
    .replace(/　/g, ' ')
    .replace(/^\d{3}-?\d{4}\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function simplifyAddress(address) {
  const spaceIdx = address.lastIndexOf(' ');
  if (spaceIdx > 0) return address.substring(0, spaceIdx).trim();
  const match = address.match(/^(.*?)(\d+(?:-\d+)*)$/);
  if (!match) return null;
  const [, prefix, numPart] = match;
  const parts = numPart.split('-');
  if (parts.length <= 1) {
    const trimmed = prefix.trimEnd();
    return trimmed.length > 0 ? trimmed : null;
  }
  return prefix + parts.slice(0, -1).join('-');
}

async function fetchGeoGSI(address) {
  try {
    const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const results = await res.json();
    if (!results.length) return null;
    const [lng, lat] = results[0].geometry.coordinates;
    return { lat, lng };
  } catch { return null; }
}

async function geocodeAddress(address) {
  let current = normalizeAddress(address);
  while (current) {
    const result = await fetchGeoGSI(current);
    if (result) return result;
    current = simplifyAddress(current);
  }
  return null;
}

const { data: members } = await supabase
  .from('members')
  .select('id, name, address')
  .is('lat', null);

console.log(`未ジオコーディング: ${members.length} 件`);
let success = 0, failed = 0;

for (let i = 0; i < members.length; i++) {
  const { id, name, address } = members[i];
  process.stdout.write(`[${i + 1}/${members.length}] ${name} ... `);
  const geo = await geocodeAddress(address);
  if (geo) {
    await supabase.from('members').update({ lat: geo.lat, lng: geo.lng }).eq('id', id);
    console.log(`✓ (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`);
    success++;
  } else {
    console.log('✗ 座標取得失敗');
    failed++;
  }
  await sleep(500); // 国土地理院APIは0.5秒間隔でOK
}

console.log(`\n完了: 成功 ${success} 件 / 失敗 ${failed} 件`);
