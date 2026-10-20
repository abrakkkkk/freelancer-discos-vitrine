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
    <div role="tablist" aria-label="Formatos do acervo" className="categoryTabsBar">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeTab === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(cat.id)}
            className={`categoryTabBtn ${isActive ? 'categoryTabBtnActive' : ''}`}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
