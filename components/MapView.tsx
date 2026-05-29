'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Member, Category } from '@/types/member';
import { CATEGORY_COLORS } from '@/types/member';

type HouseholdGroup = {
  key: string;
  members: Member[];
  lat: number;
  lng: number;
};

function normalizeAddressKey(address: string): string {
  return address.replace(/\s+/g, '').replace(/[０-９]/g, c =>
    String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 0x30)
  );
}

function buildGroups(members: Member[]): HouseholdGroup[] {
  const groupMap = new Map<string, Member[]>();

  for (const member of members) {
    if (!member.lat || !member.lng) continue;
    // household_id があれば優先、なければ正規化した住所文字列でグループ化
    const key = member.household_id
      ? `h-${member.household_id}`
      : `a-${normalizeAddressKey(member.address)}`;
    const group = groupMap.get(key) ?? [];
    groupMap.set(key, [...group, member]);
  }

  return Array.from(groupMap.entries()).map(([key, mems]) => ({
    key,
    members: mems,
    lat: mems[0].lat!,
    lng: mems[0].lng!,
  }));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPopupHtml(group: HouseholdGroup): string {
  const { members } = group;
  const primary = members[0];
  const isFamily = members.length > 1;

  if (isFamily) {
    const memberItems = members
      .map((m) => {
        const color = CATEGORY_COLORS[m.category as Category] ?? '#6B7280';
        const photoEl = m.photo_url
          ? `<img src="${escapeHtml(m.photo_url)}" alt="${escapeHtml(m.name)}" class="popup-photo" />`
          : `<div class="popup-avatar" style="background:${color}">${escapeHtml(m.name[0])}</div>`;
        const hobbies = m.hobbies.slice(0, 2).join('・');
        return `
          <div class="popup-family-member" data-member-id="${escapeHtml(m.id)}">
            ${photoEl}
            <div>
              <div class="popup-name">${escapeHtml(m.name)}</div>
              <div class="popup-meta">${escapeHtml(m.category)}${hobbies ? ` · ${escapeHtml(hobbies)}` : ''}</div>
            </div>
          </div>`;
      })
      .join('');

    return `
      <div class="popup-family">
        <p class="popup-family-title">👨‍👩‍👧 世帯 · ${members.length}名</p>
        ${memberItems}
        <div class="popup-address">${escapeHtml(primary.address)}</div>
      </div>`;
  }

  const color = CATEGORY_COLORS[primary.category as Category] ?? '#6B7280';
  const photoEl = primary.photo_url
    ? `<img src="${escapeHtml(primary.photo_url)}" alt="${escapeHtml(primary.name)}" class="popup-photo-lg" />`
    : `<div class="popup-avatar-lg" style="background:${color}">${escapeHtml(primary.name[0])}</div>`;

  const hobbiesHtml =
    primary.hobbies.length > 0
      ? `<div class="popup-hobbies">${primary.hobbies
          .map((h) => `<span class="hobby-chip">${escapeHtml(h)}</span>`)
          .join('')}</div>`
      : '';

  return `
    <div class="popup-single" data-member-id="${escapeHtml(primary.id)}">
      <div class="popup-single-header">
        ${photoEl}
        <div>
          <div class="popup-name-lg">${escapeHtml(primary.name)}</div>
          <span class="popup-category-badge" style="background:${color}">${escapeHtml(primary.category)}</span>
        </div>
      </div>
      ${hobbiesHtml}
      <div class="popup-address">${escapeHtml(primary.address)}</div>
    </div>`;
}

function groupsToGeoJSON(
  groups: HouseholdGroup[],
  activeHobbies: string[],
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = groups.map((group) => {
    const primary = group.members[0];
    const hasActiveHobby =
      activeHobbies.length === 0 ||
      group.members.some((m) => m.hobbies.some((h) => activeHobbies.includes(h)));

    const color = hasActiveHobby
      ? (CATEGORY_COLORS[primary.category as Category] ?? '#6B7280')
      : '#9CA3AF';

    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [group.lng, group.lat] },
      properties: {
        key: group.key,
        primaryMemberId: primary.id,
        category: primary.category,
        color,
        opacity: hasActiveHobby ? 1 : 0.3,
        memberCount: group.members.length,
        popupHtml: buildPopupHtml(group),
      },
    };
  });

  return { type: 'FeatureCollection', features };
}

interface MapViewProps {
  members: Member[];
  selectedCategory: string[];
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const onMemberClickRef = useRef(onMemberClick);
  const membersRef = useRef(members);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => { onMemberClickRef.current = onMemberClick; }, [onMemberClick]);
  useEffect(() => { membersRef.current = members; }, [members]);

  const allGroups = useMemo(() => buildGroups(members), [members]);

  const filteredGroups = useMemo(() => {
    if (selectedCategory.length === 0) return allGroups;
    return allGroups.filter((g) =>
      g.members.some((m) => selectedCategory.includes(m.category)),
    );
  }, [allGroups, selectedCategory]);

  // マップの初期化（一度だけ）
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxzoom: 19,
          },
        },
        layers: [
          { id: 'osm-tiles', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 20 },
        ],
      },
      center: [139.6454, 35.6415],
      zoom: 13,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      map.addSource('members', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // 個別メンバーポイント
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'members',
        paint: {
          'circle-color': ['coalesce', ['get', 'color'], '#6B7280'],
          'circle-radius': 13,
          'circle-opacity': ['coalesce', ['get', 'opacity'], 1],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      // 世帯グループの人数バッジ
      map.addLayer({
        id: 'unclustered-label',
        type: 'symbol',
        source: 'members',
        filter: ['>', ['coalesce', ['get', 'memberCount'], 0], 1],
        layout: {
          'text-field': ['to-string', ['coalesce', ['get', 'memberCount'], '']],
          'text-size': 11,
          'text-font': ['Noto Sans Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      });

      // 個別ポイントクリック → ポップアップ表示
      map.on('click', 'unclustered-point', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        if (!features.length) return;
        const props = features[0].properties as { primaryMemberId: string; popupHtml: string };
        const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];

        popupRef.current?.remove();
        const popup = new maplibregl.Popup({ offset: 20, maxWidth: '300px' })
          .setLngLat(coords)
          .setHTML(props.popupHtml)
          .addTo(map);
        popupRef.current = popup;

        // ポップアップ内のメンバークリックをデリゲート
        popup.getElement()?.addEventListener('click', (ev) => {
          const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-member-id]');
          if (!el) return;
          const memberId = el.dataset.memberId;
          const member = membersRef.current.find((m) => m.id === memberId);
          if (member) onMemberClickRef.current(member);
        });
      });

      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });

      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // フィルター変更時にGeoJSONデータを更新
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const source = mapRef.current.getSource('members') as maplibregl.GeoJSONSource | undefined;
    source?.setData(groupsToGeoJSON(filteredGroups, activeHobbies));
  }, [mapLoaded, filteredGroups, activeHobbies]);

  // 選択メンバーへフォーカス
  useEffect(() => {
    if (!focusedMember?.lat || !focusedMember?.lng || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [focusedMember.lng, focusedMember.lat],
      zoom: 16,
      duration: 800,
    });
  }, [focusedMember]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
