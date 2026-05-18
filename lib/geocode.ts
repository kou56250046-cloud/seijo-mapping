export interface GeoResult {
  lat: number;
  lng: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

// 日本の番地形式（1-2-3）を末尾から削って段階的にフォールバック
// "〇〇1-2-3" → "〇〇1-2" → "〇〇1" → "〇〇" の順に短縮
function simplifyAddress(address: string): string | null {
  const match = address.match(/^(.*?)(\d+(?:-\d+)*)$/);
  if (!match) return null;
  const [, prefix, numPart] = match;
  const parts = numPart.split('-');
  if (parts.length <= 1) {
    // 数字ごと除去して prefix だけ返す（末尾の空白もトリム）
    const trimmed = prefix.trimEnd();
    return trimmed.length > 0 ? trimmed : null;
  }
  return prefix + parts.slice(0, -1).join('-');
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  let current: string | null = address;
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
