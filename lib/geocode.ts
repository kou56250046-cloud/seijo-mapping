export interface GeoResult {
  lat: number;
  lng: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function normalizeAddress(address: string): string {
  return address
    .replace(/[\n\r\t]/g, ' ')
    .replace(/〒/g, '')
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 0x30))
    .replace(/[１-９Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[－ーｰ−–—━～]/g, '-')
    .replace(/　/g, ' ')
    .replace(/^\d{3}-?\d{4}\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchGeo(address: string): Promise<GeoResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=jp`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'seijo-mapping/1.0 (church-member-map)' },
    });
    if (!res.ok) return null;
    const results = await res.json();
    if (!results.length) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}

function simplifyAddress(address: string): string | null {
  // スペースがあれば最後のスペース以降（マンション名・部屋番号）を除去
  const spaceIdx = address.lastIndexOf(' ');
  if (spaceIdx > 0) {
    return address.substring(0, spaceIdx).trim();
  }
  // 番地末尾の数字を1段階削る
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

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  let current: string | null = normalizeAddress(address);
  while (current) {
    const result = await fetchGeo(current);
    if (result) return result;
    current = simplifyAddress(current);
  }
  return null;
}

export async function geocodeWithDelay(address: string, delayMs = 1100): Promise<GeoResult | null> {
  const result = await geocodeAddress(address);
  await sleep(delayMs);
  return result;
}
