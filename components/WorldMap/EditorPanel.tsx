"use client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { MapLocation } from "@/types/map";

type RegionMap = Record<string, { name: string; subregions: Record<string, string[]> }>;

const REGIONS: RegionMap = {
  capitale: {
    name: "Regno di Valdara",
    subregions: {
      "Regione della Capitale": [
        "loc_valdara_square", "loc_harbor", "loc_market", "loc_palace",
        "loc_blacksmith", "loc_inn", "loc_temple", "loc_abandoned_warehouse", "loc_old_road",
      ],
    },
  },
  foresta: {
    name: "Foresta di Lyr",
    subregions: {
      "Foresta": ["lyr_forest", "loc_eastern_grove", "loc_western_grove", "loc_echo_lake", "lost_sanctuary", "loc_first_stone_crypt"],
    },
  },
  costa: {
    name: "Costa Occidentale",
    subregions: {
      "Costa": ["loc_gray_port", "loc_tide_lighthouse", "loc_wreck_rocks", "loc_smuggler_cove", "loc_salsombra_caves"],
    },
  },
  monti: {
    name: "Monti Orientali",
    subregions: {
      "Monti": ["loc_iron_mines", "loc_rockfort", "loc_star_observatory", "loc_giant_pass", "loc_stoneheart_caves"],
    },
  },
};

type Props = {
  locations: MapLocation[];
  selectedEditId: string | null;
  onSelectEdit: (id: string | null) => void;
  onEditModeToggle: () => void;
  onSave: () => void;
  isEditing: boolean;
  gridSnap: boolean;
  onGridSnapToggle: () => void;
  onFocusLocation: (id: string) => void;
};

export function EditorPanel({
  locations,
  selectedEditId,
  onSelectEdit,
  onEditModeToggle,
  onSave,
  isEditing,
  gridSnap,
  onGridSnapToggle,
  onFocusLocation,
}: Props) {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set(Object.keys(REGIONS)));
  const [expandedSubregions, setExpandedSubregions] = useState<Set<string>>(new Set(Object.values(REGIONS).flatMap(r => Object.keys(r.subregions))));

  const locMap = useMemo(() => {
    const m = new Map<string, MapLocation>();
    for (const l of locations) m.set(l.id, l);
    return m;
  }, [locations]);

  const toggleRegion = useCallback((id: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSubregion = useCallback((id: string) => {
    setExpandedSubregions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleLocationClick = useCallback((id: string) => {
    onFocusLocation(id);
    onSelectEdit(id);
  }, [onFocusLocation, onSelectEdit]);

  return (
    <motion.div
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed right-0 top-0 z-50 h-full w-72 border-l border-white/[0.08] shadow-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(15,13,22,0.98) 0%, rgba(8,8,14,0.96) 100%)",
        backdropFilter: "blur(20px)",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#d4c5a9] font-serif tracking-wide">
            🌍 Asteria
          </h2>
          <button
            onClick={onEditModeToggle}
            className="text-[10px] uppercase tracking-wider text-[#a09070] hover:text-white transition-colors"
          >
            Esci
          </button>
        </div>
      </div>

      {/* Location tree */}
      <div className="overflow-y-auto h-[calc(100%-180px)] px-2 py-2">
        {Object.entries(REGIONS).map(([regionId, region]) => {
          const isRegionExpanded = expandedRegions.has(regionId);
          return (
            <div key={regionId} className="mb-1">
              <button
                onClick={() => toggleRegion(regionId)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#a09070] hover:text-[#d4c5a9] rounded-md hover:bg-white/[0.04] transition-all text-left"
              >
                <span className="text-[9px]">{isRegionExpanded ? "▼" : "▶"}</span>
                {region.name}
              </button>
              {isRegionExpanded && Object.entries(region.subregions).map(([subId, locIds]) => {
                const isSubExpanded = expandedSubregions.has(subId);
                return (
                  <div key={subId} className="ml-3 mb-0.5">
                    <button
                      onClick={() => toggleSubregion(subId)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] text-[#807060] hover:text-[#c8b892] rounded-md hover:bg-white/[0.03] transition-all text-left"
                    >
                      <span className="text-[8px]">{isSubExpanded ? "▼" : "▶"}</span>
                      {subId}
                    </button>
                    {isSubExpanded && locIds.map((locId) => {
                      const loc = locMap.get(locId);
                      if (!loc) return null;
                      const isSelected = selectedEditId === locId;
                      return (
                        <button
                          key={locId}
                          onClick={() => handleLocationClick(locId)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all text-left ${
                            isSelected
                              ? "bg-[#ffcc44]/10 text-[#ffcc44] border border-[#ffcc44]/20"
                              : "text-[#c8b892] hover:bg-white/[0.03] hover:text-white"
                          }`}
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: CAT_COLORS[loc.category] ?? "#88ccff" }}
                          />
                          <span className="truncate">{loc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.06] p-3 space-y-2">
        {/* Grid snap toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={gridSnap}
            onChange={onGridSnapToggle}
            className="accent-[#ffcc44]"
          />
          <span className="text-[10px] uppercase tracking-wider text-[#807060]">
            Allineamento griglia
          </span>
        </label>

        {/* Save button */}
        <button
          onClick={onSave}
          className="w-full rounded-lg border border-[#ffcc44]/30 bg-[#ffcc44]/10 py-2 text-xs font-semibold text-[#ffcc44] hover:bg-[#ffcc44]/20 transition-all"
        >
          Salva coordinate
        </button>

        {/* Help text */}
        <p className="text-[8px] text-[#504030] text-center leading-relaxed">
          Trascina per spostare · Maniglie per ridimensionare
        </p>
      </div>
    </motion.div>
  );
}

const CAT_COLORS: Record<string, string> = {
  city: "#ffcc44",
  forest: "#44cc66",
  dungeon: "#cc44aa",
  harbor: "#44ddff",
  mountain: "#ccaa88",
  ruin: "#aa8866",
  temple: "#8888cc",
  shop: "#ffaa44",
  landmark: "#aaccdd",
};
