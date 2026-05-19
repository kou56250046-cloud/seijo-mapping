'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Member, Category } from '@/types/member';
import { CATEGORY_COLORS } from '@/types/member';

type HouseholdGroup = {
  key: string;
  members: Member[];
  lat: number;
  lng: number;
};

function buildGroups(members: Member[]): HouseholdGroup[] {
  const familyMap = new Map<string, Member[]>();
  const singles: Member[] = [];

  for (const member of members) {
    if (member.household_id) {
      const group = familyMap.get(member.household_id) ?? [];
      familyMap.set(member.household_id, [...group, member]);
    } else {
      singles.push(member);
    }
  }

  const groups: HouseholdGroup[] = [];

  for (const [hid, mems] of familyMap.entries()) {
    const anchor = mems.find((m) => m.lat && m.lng);
    if (!anchor) continue;
    groups.push({ key: `h-${hid}`, members: mems, lat: anchor.lat!, lng: anchor.lng! });
  }

  for (const member of singles) {
    if (!member.lat || !member.lng) continue;
    groups.push({ key: `s-${member.id}`, members: [member], lat: member.lat, lng: member.lng });
  }

  return groups;
}

function createPinIcon(color: string, count: number, dimmed: boolean, photoUrl?: string): L.DivIcon {
  const isFamily = count > 1;
  const size = isFamily ? 42 : 36;
  const opacity = dimmed ? 0.25 : 1;

  let inner: string;
  if (photoUrl) {
    const badge = isFamily ? `<div class="map-pin-count">${count}</div>` : '';
    inner = `<img src="${photoUrl}" alt="" class="map-pin-img" />${badge}`;
  } else if (isFamily) {
    inner = `<span style="font-size:10px;line-height:1">👨‍👩‍👧<br/>${count}</span>`;
  } else {
    inner = `<span style="font-size:16px">●</span>`;
  }

  return L.divIcon({
    className: '',
    html: `
      <div class="map-pin${dimmed ? '' : ' map-pin-active'}${photoUrl ? ' map-pin-photo' : ''}" style="
        background:${photoUrl ? '#fff' : color};
        border-color:${color};
        width:${size}px;
        height:${size}px;
        opacity:${opacity};
      ">${inner}</div>
    `,
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -(size + 10)],
  });
}

function MapFocuser({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

interface MapViewProps {
  members: Member[];
  selectedCategory: string | null;
  activeHobbies: string[];
  focusedMember: Member | null;
  onMemberClick: (member: Member) => void;
}

export default function MapView({
  members,
  selectedCategory,
  activeHobbies,
  focusedMember,
  onMemberClick,
}: MapViewProps) {
  const groups = useMemo(() => {
    const filtered = selectedCategory
      ? members.filter((m) => m.category === selectedCategory)
      : members;
    return buildGroups(filtered);
  }, [members, selectedCategory]);

  return (
    <MapContainer
      center={[35.6415, 139.6454]}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={20}
      />
      {focusedMember?.lat && focusedMember?.lng && (
        <MapFocuser lat={focusedMember.lat} lng={focusedMember.lng} />
      )}
      {groups.map((group) => {
        const isFamily = group.members.length > 1;
        const primary = group.members[0];
        const hasActiveHobby =
          activeHobbies.length === 0 ||
          group.members.some((m) => m.hobbies.some((h) => activeHobbies.includes(h)));

        const color = hasActiveHobby
          ? (CATEGORY_COLORS[primary.category as Category] ?? '#6B7280')
          : '#374151';

        const photoUrl = primary.photo_url || undefined;
        const icon = createPinIcon(color, group.members.length, !hasActiveHobby, photoUrl);

        return (
          <Marker key={group.key} position={[group.lat, group.lng]} icon={icon}>
            <Popup className="member-popup" maxWidth={280}>
              {isFamily ? (
                <div className="popup-family">
                  <p className="popup-family-title">👨‍👩‍👧 世帯 · {group.members.length}名</p>
                  {group.members.map((m) => (
                    <div
                      key={m.id}
                      className="popup-family-member"
                      onClick={() => onMemberClick(m)}
                    >
                      {m.photo_url ? (
                        <img src={m.photo_url} alt={m.name} className="popup-photo" />
                      ) : (
                        <div className="popup-avatar" style={{ background: CATEGORY_COLORS[m.category as Category] }}>
                          {m.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="popup-name">{m.name}</div>
                        <div className="popup-meta">{m.category}
                          {m.hobbies.length > 0 && ` · ${m.hobbies.slice(0, 2).join('・')}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="popup-address">{primary.address}</div>
                </div>
              ) : (
                <div className="popup-single" onClick={() => onMemberClick(primary)}>
                  <div className="popup-single-header">
                    {primary.photo_url ? (
                      <img src={primary.photo_url} alt={primary.name} className="popup-photo-lg" />
                    ) : (
                      <div
                        className="popup-avatar-lg"
                        style={{ background: CATEGORY_COLORS[primary.category as Category] }}
                      >
                        {primary.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="popup-name-lg">{primary.name}</div>
                      <span
                        className="popup-category-badge"
                        style={{ background: CATEGORY_COLORS[primary.category as Category] }}
                      >
                        {primary.category}
                      </span>
                    </div>
                  </div>
                  {primary.hobbies.length > 0 && (
                    <div className="popup-hobbies">
                      {primary.hobbies.map((h) => (
                        <span key={h} className="hobby-chip">{h}</span>
                      ))}
                    </div>
                  )}
                  <div className="popup-address">{primary.address}</div>
                </div>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
