'use client';

interface SearchBoxProps {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <div className="search-box">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="氏名・住所で検索..."
        className="search-input"
      />
      {value && (
        <button className="search-clear" onClick={() => onChange('')}>✕</button>
      )}
    </div>
  );
}
