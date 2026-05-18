'use client';

import { useState, useRef } from 'react';

interface ImportResult {
  success: number;
  failed: number;
  total: number;
  errors: string[];
}

interface ImportModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function ImportModal({ onClose, onComplete }: ImportModalProps) {
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!file) { setError('ファイルを選択してください'); return; }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'インポートに失敗しました'); return; }
      setResult(data);
      onComplete();
    } catch {
      setError('サーバーエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">CSVインポート</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-form">
          <div className="import-format">
            <p className="filter-label">CSVフォーマット</p>
            <code className="csv-sample">
              氏名,住所,区分,写真URL,趣味,世帯ID<br />
              山田 太郎,東京都世田谷区成城1-1-1,壮年,,釣り|読書,1
            </code>
            <p className="import-note">※ 趣味は「|」区切り。ジオコーディングに時間がかかります。</p>
          </div>

          <div className="form-row">
            <label className="form-label">インポートモード</label>
            <div className="mode-select">
              <label className={`mode-option ${mode === 'append' ? 'mode-option-active' : ''}`}>
                <input type="radio" value="append" checked={mode === 'append'} onChange={() => setMode('append')} />
                追加（既存データを保持）
              </label>
              <label className={`mode-option ${mode === 'replace' ? 'mode-option-active' : ''}`}>
                <input type="radio" value="replace" checked={mode === 'replace'} onChange={() => setMode('replace')} />
                <span className="replace-label">上書き（全データを削除して再登録）</span>
              </label>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">CSVファイル</label>
            <div
              className="file-drop-zone"
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <span className="file-name">📄 {file.name}</span>
              ) : (
                <span className="file-placeholder">クリックしてファイルを選択</span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          {result && (
            <div className="import-result">
              <p className="result-ok">✓ 成功: {result.success}件</p>
              {result.failed > 0 && <p className="result-err">✗ 失敗: {result.failed}件</p>}
              {result.errors.length > 0 && (
                <ul className="result-errors">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          {loading && (
            <div className="import-loading">
              <div className="loading-spinner" />
              <p>ジオコーディング中... 住所1件あたり約1秒かかります</p>
            </div>
          )}

          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>閉じる</button>
            <button
              className="btn-save"
              onClick={handleImport}
              disabled={loading || !file || !!result}
            >
              インポート開始
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
