'use client';

interface HobbyFilterProps {
  hobbies: string[];
  active: string[];
  onChange: (hobbies: string[]) => void;
}

export default function HobbyFilter({ hobbies, active, onChange }: HobbyFilterProps) {
  if (hobbies.length === 0) return null;

  const toggle = (hobby: string) => {
    onChange(active.includes(hobby) ? active.filter((h) => h !== hobby) : [...active, hobby]);
  };

  return (
    <div className="filter-section">
      <div className="filter-label-row">
        <p className="filter-label">趣味</p>
        {active.length > 0 && (
          <button className="filter-clear" onClick={() => onChange([])}>クリア</button>
        )}
      </div>
      <div className="filter-chips">
        {hobbies.map((hobby) => (
          <button
            key={hobby}
            className={`filter-chip ${active.includes(hobby) ? 'filter-chip-hobby-active' : ''}`}
            onClick={() => toggle(hobby)}
          >
            {hobby}
          </button>
        ))}
      </div>
    </div>
  );
}
