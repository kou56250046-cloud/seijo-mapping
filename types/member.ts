export type Category = '青年' | '家庭青年' | '壮年' | '壮婦' | '教会長';

export const CATEGORIES: Category[] = ['青年', '家庭青年', '壮年', '壮婦', '教会長'];

export const CATEGORY_COLORS: Record<Category, string> = {
  青年: '#3B82F6',
  家庭青年: '#06B6D4',
  壮年: '#F97316',
  壮婦: '#EC4899',
  教会長: '#8B5CF6',
};

export interface Member {
  id: string;
  name: string;
  address: string;
  category: Category;
  photo_url?: string | null;
  hobbies: string[];
  household_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  created_at: string;
  updated_at: string;
}

export type MemberInput = Omit<Member, 'id' | 'created_at' | 'updated_at'>;
