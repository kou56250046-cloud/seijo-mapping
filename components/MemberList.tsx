'use client';

import type { Member, Category } from '@/types/member';
import { CATEGORY_COLORS } from '@/types/member';

interface MemberListProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onFocus: (member: Member) => void;
}

export default function MemberList({ members, onEdit, onDelete, onFocus }: MemberListProps) {
  if (members.length === 0) {
    return <p className="empty-msg">メンバーが見つかりません</p>;
  }

  return (
    <div className="member-list">
      {members.map((member, i) => (
        <div
          key={member.id}
          className="member-card"
          style={{ animationDelay: `${i * 40}ms` }}
          onClick={() => onFocus(member)}
        >
          <div className="member-card-left">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.name} className="member-photo" />
            ) : (
              <div
                className="member-avatar"
                style={{ background: CATEGORY_COLORS[member.category as Category] }}
              >
                {member.name[0]}
              </div>
            )}
          </div>
          <div className="member-card-body">
            <div className="member-card-top">
              <span className="member-name">{member.name}</span>
              <span
                className="member-badge"
                style={{ background: CATEGORY_COLORS[member.category as Category] }}
              >
                {member.category}
              </span>
            </div>
            <p className="member-address">{member.address}</p>
            {member.hobbies.length > 0 && (
              <p className="member-hobbies">{member.hobbies.join('・')}</p>
            )}
          </div>
          <div className="member-card-actions" onClick={(e) => e.stopPropagation()}>
            <button className="action-btn edit-btn" onClick={() => onEdit(member)} title="編集">✏️</button>
            <button
              className="action-btn delete-btn"
              onClick={() => {
                if (confirm(`${member.name} を削除しますか？`)) onDelete(member.id);
              }}
              title="削除"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
