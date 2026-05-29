// 元のフォームCSVでSupabaseのデータを正しい情報に修正する
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 「ー」を残しつつ最小限の正規化（ジオコーディング用ではなく表示用）
function normalizeAddressDisplay(address) {
  return address
    .replace(/[\n\r\t]/g, ' ')
    .replace(/〒/g, '')
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 0x30))
    .replace(/[Ａ-Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[－−–—━]/g, '-')   // ー（長音符）は変換しない
    .replace(/　/g, ' ')
    .replace(/^\d{3}-?\d{4}\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 元のフォームCSVを手動パース（ヘッダー: タイムスタンプ,お名前,ご住所,所属区分,趣味）
const csvText = readFileSync(
  new URL('../../../Downloads/教会メンバー情報登録（回答） - フォームの回答 1.csv', import.meta.url),
  'utf8'
);

// PapaParseなしで簡易パース（複数行フィールド対応）
function parseSimpleCSV(text) {
  const rows = [];
  let i = 0;
  // ヘッダー行をスキップ
  while (i < text.length && text[i] !== '\n') i++;
  i++; // 改行をスキップ

  while (i < text.length) {
    const fields = [];
    while (i < text.length && text[i] !== '\n') {
      if (text[i] === '"') {
        // クォートフィールド
        i++;
        let field = '';
        while (i < text.length) {
          if (text[i] === '"' && text[i+1] === '"') { field += '"'; i += 2; }
          else if (text[i] === '"') { i++; break; }
          else { field += text[i++]; }
        }
        fields.push(field);
        if (text[i] === ',') i++;
      } else {
        let field = '';
        while (i < text.length && text[i] !== ',' && text[i] !== '\n') {
          field += text[i++];
        }
        fields.push(field);
        if (text[i] === ',') i++;
      }
    }
    if (text[i] === '\n') i++;
    if (fields.length >= 4 && fields[1]) rows.push(fields);
  }
  return rows;
}

const formRows = parseSimpleCSV(csvText);
// [timestamp, name, address, category, hobbies]

console.log(`フォームデータ: ${formRows.length} 件`);

const { data: members } = await supabase.from('members').select('id, name');
const nameToId = Object.fromEntries(members.map(m => [m.name.trim(), m.id]));

let updated = 0, skipped = 0;
for (const [, name, rawAddress, category, hobbies] of formRows) {
  const trimmedName = name.trim();
  const id = nameToId[trimmedName];
  if (!id) {
    console.log(`  ⚠ 名前が見つかりません: "${trimmedName}"`);
    skipped++;
    continue;
  }

  const address = normalizeAddressDisplay(rawAddress);
  const hobbyList = hobbies?.trim() ? [hobbies.trim()] : [];

  const { error } = await supabase
    .from('members')
    .update({ address, hobbies: hobbyList })
    .eq('id', id);

  if (error) {
    console.log(`  ✗ ${trimmedName}: ${error.message}`);
  } else {
    console.log(`  ✓ ${trimmedName}: 住所・趣味を更新`);
    updated++;
  }
}

console.log(`\n完了: 更新 ${updated} 件 / スキップ ${skipped} 件`);
