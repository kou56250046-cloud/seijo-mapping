'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Member, MemberInput, Category } from '@/types/member';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MemberModal from '@/components/MemberModal';
import ImportModal from '@/components/ImportModal';

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

  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/members');
    if (res.ok) setMembers(await res.json());
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

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
          onFocus={setFocusedMember}
          onAdd={openAdd}
        />

        <div className="map-area">
          <MapView
            members={members}
            selectedCategory={selectedCategory}
            activeHobbies={activeHobbies}
            focusedMember={focusedMember}
            onMemberClick={(m) => { openEdit(m); }}
          />
        </div>
      </div>

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
          onComplete={() => { fetchMembers(); setIsImportOpen(false); }}
        />
      )}
    </div>
  );
}
