'use client';

interface HeaderProps {
  onImport: () => void;
  onExport: () => void;
  onLogout: () => void;
}

export default function Header({ onImport, onExport, onLogout }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="header-icon">✝</span>
        <h1 className="header-title">成城チャーチ メンバーマップ</h1>
      </div>
      <div className="header-actions">
        <button className="header-btn" onClick={onImport}>
          <span>📥</span><span className="header-btn-text"> CSVインポート</span>
        </button>
        <button className="header-btn" onClick={onExport}>
          <span>📤</span><span className="header-btn-text"> エクスポート</span>
        </button>
        <button className="header-btn header-btn-logout" onClick={onLogout}>
          <span className="header-btn-logout-icon">🚪</span><span className="header-btn-text"> ログアウト</span>
        </button>
      </div>
    </header>
  );
}
