// 座標の修正：異なる住所に同じ座標が割り当てられているケースを再ジオコーディング
// 同じ住所で座標がずれているペアを統一する
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
    .replace(/[Ａ-Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[ー]/g, '-') // 長音符は番地区切りとして扱う（ジオコーディング用）
    .replace(/[－ｰ−–—━～]/g, '-')
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

// 1. 異なる住所なのに座標が同じメンバーを特定して再ジオコーディング
console.log('=== 異なる住所・同一座標のメンバーを再ジオコーディング ===');
const problematic = [
  { name: '林晋一郎', address: '東京都世田谷区千歳台3-25-5 クリオ千歳船橋701' },
  { name: '直江節子', address: '東京都世田谷区千歳台1-13-16 コーポ丸菱102' },
  { name: '直江　義孝', address: '東京都世田谷区千歳台1-13-16 コーポ丸菱102' },
  { name: '廣瀬義昭', address: '東京都世田谷区喜多見6ー25ー6' },
  { name: '小川葉子', address: '東京都世田谷区喜多見7-18-13' },
];

for (const { name, address } of problematic) {
  process.stdout.write(`  ${name} (${address}) ... `);
  const geo = await geocodeAddress(address);
  if (geo) {
    const { data } = await supabase.from('members').select('id').eq('name', name).single();
    if (data) {
      await supabase.from('members').update({ lat: geo.lat, lng: geo.lng }).eq('id', data.id);
      console.log(`✓ (${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)})`);
    }
  } else {
    console.log('✗ 座標取得失敗');
  }
  await sleep(500);
}

// 2. 同じ住所で座標が違うペアを統一（最初のメンバーの座標に揃える）
console.log('\n=== 同住所メンバーの座標を統一 ===');
const { data: allMembers } = await supabase.from('members').select('id, name, address, lat, lng');

// 住所でグループ化
const addressGroups = new Map();
for (const m of allMembers) {
  const key = m.address.replace(/\s+/g, '');
  if (!addressGroups.has(key)) addressGroups.set(key, []);
  addressGroups.get(key).push(m);
}

for (const [, group] of addressGroups) {
  if (group.length < 2) continue;
  const anchor = group.find(m => m.lat && m.lng);
  if (!anchor) continue;

  for (const m of group) {
    if (m.id === anchor.id) continue;
    if (Math.abs(m.lat - anchor.lat) < 0.00001 && Math.abs(m.lng - anchor.lng) < 0.00001) continue;
    console.log(`  ${m.name} → ${anchor.name} の座標に統一`);
    await supabase.from('members').update({ lat: anchor.lat, lng: anchor.lng }).eq('id', m.id);
  }
}

console.log('\n完了');
