'use client';

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import type { Member, MemberInput, Category } from '@/types/member';
import { CATEGORIES, CATEGORY_COLORS } from '@/types/member';

interface MemberModalProps {
  member: Member | null;
  onClose: () => void;
  onSave: (data: MemberInput) => Promise<void>;
}

const EMPTY: MemberInput = {
  name: '',
  address: '',
  category: '青年',
  photo_url: null,
  hobbies: [],
  household_id: null,
  lat: null,
  lng: null,
};

export default function MemberModal({ member, onClose, onSave }: MemberModalProps) {
  const [form, setForm] = useState<MemberInput>(EMPTY);
  const [hobbyInput, setHobbyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const prevObjectUrl = useRef<string | null>(null);

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name,
        address: member.address,
        category: member.category,
        photo_url: member.photo_url ?? null,
        hobbies: member.hobbies,
        household_id: member.household_id ?? null,
        lat: member.lat ?? null,
        lng: member.lng ?? null,
      });
    } else {
      setForm(EMPTY);
    }
    setHobbyInput('');
    setError('');
    setUploadError('');
    setPreviewUrl(member?.photo_url ?? null);
    if (prevObjectUrl.current) {
      URL.revokeObjectURL(prevObjectUrl.current);
      prevObjectUrl.current = null;
    }
  }, [member]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
    const objectUrl = URL.createObjectURL(file);
    prevObjectUrl.current = objectUrl;
    setPreviewUrl(objectUrl);
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error ?? 'アップロードに失敗しました');
        setPreviewUrl(form.photo_url ?? null);
        URL.revokeObjectURL(objectUrl);
        prevObjectUrl.current = null;
      } else {
        setForm((f) => ({ ...f, photo_url: json.url }));
      }
    } catch {
      setUploadError('アップロードに失敗しました');
      setPreviewUrl(form.photo_url ?? null);
      URL.revokeObjectURL(objectUrl);
      prevObjectUrl.current = null;
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function addHobby() {
    const h = hobbyInput.trim();
    if (h && !form.hobbies.includes(h)) {
      setForm((f) => ({ ...f, hobbies: [...f.hobbies, h] }));
    }
    setHobbyInput('');
  }

  function removeHobby(h: string) {
    setForm((f) => ({ ...f, hobbies: f.hobbies.filter((x) => x !== h) }));
  }

  function handleHobbyKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addHobby(); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      setError('氏名と住所は必須です');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch {
      setError('保存に失敗しました');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{member ? 'メンバーを編集' : 'メンバーを追加'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <label className="form-label">氏名 *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="山田 太郎"
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">住所 *</label>
            <input
              className="form-input"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="東京都世田谷区成城1-1-1"
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">区分 *</label>
            <div className="category-select-group">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-btn ${form.category === cat ? 'category-btn-active' : ''}`}
                  style={form.category === cat ? { background: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] } : {}}
                  onClick={() => setForm((f) => ({ ...f, category: cat as Category }))}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">写真</label>
            {previewUrl && (
              <img src={previewUrl} alt="プレビュー" className="photo-preview" />
            )}
            <label className="photo-upload-btn">
              {uploading ? 'アップロード中...' : '画像を選択'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
            {uploadError && <p className="form-error">{uploadError}</p>}
            <input
              className="form-input"
              value={form.photo_url ?? ''}
              onChange={(e) => {
                setForm((f) => ({ ...f, photo_url: e.target.value || null }));
                setPreviewUrl(e.target.value || null);
              }}
              placeholder="または画像URLを直接入力"
            />
          </div>

          <div className="form-row">
            <label className="form-label">趣味</label>
            <div className="hobby-input-row">
              <input
                className="form-input"
                value={hobbyInput}
                onChange={(e) => setHobbyInput(e.target.value)}
                onKeyDown={handleHobbyKeyDown}
                placeholder="趣味を入力してEnter"
              />
              <button type="button" className="hobby-add-btn" onClick={addHobby}>追加</button>
            </div>
            {form.hobbies.length > 0 && (
              <div className="hobby-tags">
                {form.hobbies.map((h) => (
                  <span key={h} className="hobby-tag-edit">
                    {h}
                    <button type="button" onClick={() => removeHobby(h)}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <label className="form-label">世帯ID</label>
            <input
              className="form-input"
              value={form.household_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, household_id: e.target.value || null }))}
              placeholder="同じ家族は同じ番号（例: 1）"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>キャンセル</button>
            <button type="submit" className="btn-save" disabled={saving || uploading}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
