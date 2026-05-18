'use client';

import type { Category } from '@/types/member';
import { CATEGORIES, CATEGORY_COLORS } from '@/types/member';

interface CategoryFilterProps {
  selected: Category | null;
  onChange: (cat: Category | null) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="filter-section">
      <p className="filter-label">区分</p>
      <div className="filter-chips">
        <button
          className={`filter-chip ${selected === null ? 'filter-chip-all' : ''}`}
          onClick={() => onChange(null)}
        >
          すべて
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${selected === cat ? 'filter-chip-active' : ''}`}
            style={selected === cat ? { background: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] } : {}}
            onClick={() => onChange(selected === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
