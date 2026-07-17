"use client";

import { useState } from "react";
import { SearchInput } from "./SearchInput";

type CrudLayoutProps = {
  title: string;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: { value: string; label: string }[];
  onNew: () => void;
  newLabel?: string;
  list: React.ReactNode;
  editor: React.ReactNode;
};

export function CrudLayout({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  sortOptions,
  onNew,
  newLabel = "Nuovo",
  list,
  editor
}: CrudLayoutProps) {
  const [showMobileList, setShowMobileList] = useState(true);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className={`w-full lg:w-80 lg:shrink-0 ${showMobileList ? "block" : "hidden lg:block"}`}>
        <div className="veil-premium-card overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm uppercase tracking-[0.24em] text-veil-gold">{title}</h3>
              <button className="veil-btn text-xs !px-3 !py-1.5" onClick={onNew}>
                + {newLabel}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <SearchInput value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
              {sortOptions && onSortChange && sortValue && (
                <select
                  className="veil-input w-full text-sm"
                  value={sortValue}
                  onChange={e => onSortChange(e.target.value)}
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {list}
          </div>
        </div>
      </div>

      <div className={`min-w-0 flex-1 ${!showMobileList ? "block" : "hidden lg:block"}`}>
        <button
          className="mb-2 text-xs text-white/50 lg:hidden"
          onClick={() => setShowMobileList(true)}
        >
          ← Torna alla lista
        </button>
        {editor}
      </div>
    </div>
  );
}
