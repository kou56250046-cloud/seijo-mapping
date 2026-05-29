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
  selectedCategory: Category[];
  activeHobbies: string[];
  onSearch: (q: string) => void;
  onCategoryChange: (cats: Category[]) => void;
  onHobbyChange: (hobbies: string[]) => void;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onFocus: (member: Member) => void;
  onAdd: () => void;
  mobileVisible?: boolean;
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
  mobileVisible,
}: SidebarProps) {
  return (
    <aside className={`sidebar${mobileVisible ? ' mobile-visible' : ''}`}>
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

      <button className="fab fab-sidebar" onClick={onAdd} title="メンバーを追加">
        <span className="fab-icon">＋</span>
      </button>
    </aside>
  );
}
