"use client";
import type { DmSection } from "@/types/campaign";

type DmSidebarProps = {
  activeTab: DmSection;
  onTabChange: (tab: DmSection) => void;
  onLogout: () => void;
  onSearch: () => void;
};

const navItems: { id: DmSection; icon: string; label: string }[] = [
  { id: "home", icon: "◈", label: "Home" },
  { id: "session", icon: "▶", label: "Scenes" },
  { id: "npcs", icon: "○", label: "NPC" },
  { id: "locations", icon: "▣", label: "Locations" },
  { id: "assets", icon: "◇", label: "Items" },
  { id: "combat", icon: "⚔", label: "Combat" },
  { id: "players", icon: "◆", label: "Players" },
  { id: "campaign", icon: "◇", label: "Campaign" },
  { id: "table", icon: "▤", label: "Table" },
  { id: "settings", icon: "⚙", label: "Settings" },
];

export function DmSidebar({ activeTab, onTabChange, onLogout, onSearch }: DmSidebarProps) {
  return (
    <aside className="flex w-16 flex-col items-center border-r border-white/[0.06] bg-black/40 py-4">
      <div className="mb-6">
        <span className="text-lg font-semibold text-veil-gold tracking-wider">P</span>
      </div>

      <button
        onClick={onSearch}
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg text-white/30 transition hover:bg-white/[0.04] hover:text-white"
        title="Cerca (⌘K)"
      >
        ⌕
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl text-lg transition ${
              activeTab === item.id
                ? "bg-veil-gold/12 text-veil-gold"
                : "text-white/30 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {item.icon}
            <span className="absolute left-full ml-3 hidden rounded-lg border border-white/[0.06] bg-[#0f1015] px-3 py-1.5 text-xs text-white shadow-2xl group-hover:block whitespace-nowrap z-50">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <button
        onClick={onLogout}
        className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg text-white/20 transition hover:bg-white/[0.04] hover:text-red-300"
        title="Esci"
      >
        ⊘
      </button>
    </aside>
  );
}