'use client';

import type { Category } from '@/types/member';
import { CATEGORIES, CATEGORY_COLORS } from '@/types/member';

interface CategoryFilterProps {
  selected: Category[];
  onChange: (cats: Category[]) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  function toggleCat(cat: Category) {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  }

  return (
    <div className="filter-section">
      <p className="filter-label">区分</p>
      <div className="filter-chips">
        <button
          className={`filter-chip ${selected.length === 0 ? 'filter-chip-all' : ''}`}
          onClick={() => onChange([])}
        >
          すべて
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${selected.includes(cat) ? 'filter-chip-active' : ''}`}
            style={selected.includes(cat) ? { background: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] } : {}}
            onClick={() => toggleCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
