'use client';

import { PiVinylRecord, PiDisc, PiFilmStrip, PiCassetteTape } from 'react-icons/pi';

export const CATEGORIES = [
  { id: 'discos', label: 'Discos', icon: PiVinylRecord },
  { id: 'cds', label: 'CDs', icon: PiDisc },
  { id: 'dvds', label: 'DVDs', icon: PiFilmStrip },
  { id: 'vhs', label: 'VHS', icon: PiCassetteTape },
];

export default function CategoryTabs({ activeTab, onTabChange }) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none',
      }}
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeTab === cat.id;

        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(cat.id)}
            style={{
              minHeight: '44px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: isActive ? '#8b1e1e' : '#151518',
              border: isActive ? '1px solid #a32424' : '1px solid #232328',
              color: isActive ? '#ffffff' : '#a1a1aa',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
          >
            <Icon size={18} color={isActive ? '#ffffff' : '#a1a1aa'} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
