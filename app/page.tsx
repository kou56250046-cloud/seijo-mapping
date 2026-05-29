'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Member, MemberInput, Category } from '@/types/member';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MemberModal from '@/components/MemberModal';
import ImportModal from '@/components/ImportModal';

type MobileTab = 'map' | 'list';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeHobbies, setActiveHobbies] = useState<string[]>([]);
  const [focusedMember, setFocusedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('map');
  const [geocodeStatus, setGeocodeStatus] = useState<string | null>(null);
  const isGeocodingRef = useRef(false);

  const geocodePending = useCallback(async (memberList: Member[]) => {
    if (isGeocodingRef.current) return;
    const pending = memberList.filter(m => m.lat === null || m.lng === null);
    if (pending.length === 0) return;

    isGeocodingRef.current = true;
    try {
      for (let i = 0; i < pending.length; i++) {
        if (!isGeocodingRef.current) break;
        const member = pending[i];
        setGeocodeStatus(`位置情報を取得中... ${i + 1} / ${pending.length}`);
        const res = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: member.id, address: member.address }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMembers(prev => prev.map(m =>
              m.id === member.id ? { ...m, lat: data.lat, lng: data.lng } : m
            ));
          }
        }
        await new Promise(r => setTimeout(r, 1100));
      }
    } finally {
      isGeocodingRef.current = false;
      setGeocodeStatus(null);
    }
  }, []);

  const fetchMembers = useCallback(async (): Promise<Member[]> => {
    const res = await fetch('/api/members');
    if (res.ok) {
      const data: Member[] = await res.json();
      setMembers(data);
      return data;
    }
    return [];
  }, []);

  useEffect(() => {
    fetchMembers().then(geocodePending);
  }, [fetchMembers, geocodePending]);

  const allHobbies = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.hobbies.forEach((h) => set.add(h)));
    return Array.from(set).sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || m.name.includes(q) || m.address.includes(q);
      const matchesCategory = !selectedCategory || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [members, searchQuery, selectedCategory]);

  async function handleSave(data: MemberInput) {
    if (editingMember) {
      await fetch(`/api/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    await fetchMembers();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function handleExport() {
    const a = document.createElement('a');
    a.href = '/api/export';
    a.click();
  }

  function openAdd() { setEditingMember(null); setIsModalOpen(true); }
  function openEdit(m: Member) { setEditingMember(m); setIsModalOpen(true); }

  return (
    <div className="app">
      <Header onImport={() => setIsImportOpen(true)} onExport={handleExport} onLogout={handleLogout} />

      {geocodeStatus && (
        <div className="geocode-status-bar">{geocodeStatus}</div>
      )}

      <div className="main-layout">
        <Sidebar
          members={members}
          filteredMembers={filteredMembers}
          allHobbies={allHobbies}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          activeHobbies={activeHobbies}
          onSearch={setSearchQuery}
          onCategoryChange={setSelectedCategory}
          onHobbyChange={setActiveHobbies}
          onEdit={openEdit}
          onDelete={handleDelete}
          onFocus={(m) => { setFocusedMember(m); setMobileTab('map'); }}
          onAdd={openAdd}
          mobileVisible={mobileTab === 'list'}
        />

        <div className={`map-area${mobileTab === 'map' ? ' mobile-visible' : ''}`}>
          <MapView
            members={members}
            selectedCategory={selectedCategory}
            activeHobbies={activeHobbies}
            focusedMember={focusedMember}
            onMemberClick={(m) => { openEdit(m); }}
          />
          <button className="fab fab-map" onClick={openAdd} title="メンバーを追加">
            <span className="fab-icon">＋</span>
          </button>
        </div>
      </div>

      <nav className="mobile-tab-bar">
        <button
          className={`mobile-tab${mobileTab === 'map' ? ' mobile-tab-active' : ''}`}
          onClick={() => setMobileTab('map')}
        >
          <span className="mobile-tab-icon">🗺️</span>
          <span className="mobile-tab-label">地図</span>
        </button>
        <button
          className={`mobile-tab${mobileTab === 'list' ? ' mobile-tab-active' : ''}`}
          onClick={() => setMobileTab('list')}
        >
          <span className="mobile-tab-icon">👥</span>
          <span className="mobile-tab-label">メンバー</span>
        </button>
      </nav>

      {isModalOpen && (
        <MemberModal
          member={editingMember}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {isImportOpen && (
        <ImportModal
          onClose={() => setIsImportOpen(false)}
          onComplete={() => {
            setIsImportOpen(false);
            isGeocodingRef.current = false;
            fetchMembers().then(geocodePending);
          }}
        />
      )}
    </div>
  );
}
