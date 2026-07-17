import type { DmSection } from "@/types/campaign";

export interface NavItem {
  id: DmSection;
  icon: string;
  label: string;
}

export const dmNavigation: NavItem[] = [
  { id: "home", icon: "◈", label: "Home" },
  { id: "campaign", icon: "◇", label: "Campaign" },
  { id: "session", icon: "▶", label: "Session" },
  { id: "players", icon: "◆", label: "Players" },
  { id: "npcs", icon: "○", label: "NPC" },
  { id: "locations", icon: "▣", label: "Locations" },
  { id: "combat", icon: "⚔", label: "Combat" },
  { id: "table", icon: "▤", label: "Table" },
  { id: "assets", icon: "◇", label: "Objects" },
  { id: "settings", icon: "⚙", label: "Settings" },
];
