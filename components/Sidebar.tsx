'use client';

import type { Member, Category } from '@/types/member';
import SearchBox from './SearchBox';
import CategoryFilter from './CategoryFilter';
import HobbyFilter from './HobbyFilter';
import MemberList from './MemberList';

interface SidebarProps {
  members: Member[];
  filteredMembers: Member[];
  allHobbies: string[];
  searchQuery: string;
  selectedCategory: Category | null;
  activeHobbies: string[];
  onSearch: (q: string) => void;
  onCategoryChange: (cat: Category | null) => void;
  onHobbyChange: (hobbies: string[]) => void;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onFocus: (member: Member) => void;
  onAdd: () => void;
}

export default function Sidebar({
  filteredMembers,
  allHobbies,
  searchQuery,
  selectedCategory,
  activeHobbies,
  onSearch,
  onCategoryChange,
  onHobbyChange,
  onEdit,
  onDelete,
  onFocus,
  onAdd,
  members,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="sidebar-top">
          <SearchBox value={searchQuery} onChange={onSearch} />
          <CategoryFilter selected={selectedCategory} onChange={onCategoryChange} />
          <HobbyFilter hobbies={allHobbies} active={activeHobbies} onChange={onHobbyChange} />
          <div className="member-count">
            {filteredMembers.length} / {members.length} 名
          </div>
        </div>

        <div className="sidebar-list">
          <MemberList
            members={filteredMembers}
            onEdit={onEdit}
            onDelete={onDelete}
            onFocus={onFocus}
          />
        </div>
      </div>

      <button className="fab" onClick={onAdd} title="メンバーを追加">
        <span className="fab-icon">＋</span>
      </button>
    </aside>
  );
}
