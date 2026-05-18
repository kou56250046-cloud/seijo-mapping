import Papa from 'papaparse';
import type { Member, MemberInput, Category } from '@/types/member';

interface CsvRow {
  氏名: string;
  住所: string;
  区分: string;
  写真URL: string;
  趣味: string;
  世帯ID: string;
}

export function parseCsv(csvText: string): MemberInput[] {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  return result.data
    .filter((row) => row.氏名?.trim() && row.住所?.trim())
    .map((row) => ({
      name: row.氏名.trim(),
      address: row.住所.trim(),
      category: (row.区分?.trim() || '青年') as Category,
      photo_url: row.写真URL?.trim() || null,
      hobbies: row.趣味 ? row.趣味.split('|').map((h) => h.trim()).filter(Boolean) : [],
      household_id: row.世帯ID?.trim() || null,
      lat: null,
      lng: null,
    }));
}

export function membersToCsv(members: Member[]): string {
  const rows = members.map((m) => ({
    氏名: m.name,
    住所: m.address,
    区分: m.category,
    写真URL: m.photo_url || '',
    趣味: m.hobbies.join('|'),
    世帯ID: m.household_id || '',
  }));
  return Papa.unparse(rows, {
    columns: ['氏名', '住所', '区分', '写真URL', '趣味', '世帯ID'],
  });
}
