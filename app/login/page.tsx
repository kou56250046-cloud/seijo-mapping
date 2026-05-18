'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'ログインに失敗しました');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/'), 600);
    } catch {
      setError('サーバーに接続できませんでした');
      setLoading(false);
    }
  }

  return (
    <div className={`login-page ${success ? 'success' : ''}`}>
      {/* 背景グラデーションアニメーション */}
      <div className="login-bg" />

      <div className="login-card">
        {/* ロゴ・タイトル */}
        <div className="login-header">
          <div className="login-icon">✝</div>
          <h1 className="login-title">成城チャーチ</h1>
          <p className="login-subtitle">メンバーマップ</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="ユーザー名を入力"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">パスワード</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="パスワードを入力"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="show-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="パスワード表示切替"
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-msg">
              ⚠ {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="btn-spinner" />
            ) : success ? (
              '✓'
            ) : (
              'ログイン'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
