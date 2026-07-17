"use client";
import { motion, AnimatePresence } from "framer-motion";
import { MapLocation } from "@/types/map";

const CATEGORY_COLORS: Record<string, string> = {
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

type Props = {
  location: MapLocation;
  isDiscovered: boolean;
  connectedLocations: MapLocation[];
  onClose: () => void;
  onNavigate: (id: string) => void;
};

export function LocationPanel({
  location,
  isDiscovered,
  connectedLocations,
  onClose,
  onNavigate,
}: Props) {
  const color = CATEGORY_COLORS[location.category] ?? "#88ccff";

  return (
    <AnimatePresence>
      <motion.div
        key={location.id}
        initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-8 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative overflow-hidden rounded-2xl border border-white/[0.10] p-6 shadow-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(20,18,28,0.96) 0%, rgba(10,10,18,0.92) 100%)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Ornate top border */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${color} 20%, ${color}80 50%, ${color} 80%, transparent 100%)`,
            }}
          />

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="h-3.5 w-3.5 rounded-full shadow-lg shrink-0"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}60`,
                }}
              />
              <div>
                <h2 className="text-xl font-bold text-[#d4c5a9] font-serif tracking-wide">
                  {isDiscovered ? location.name : "???"}
                </h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#a09070] mt-0.5">
                  {location.category}
                  {location.difficulty && (
                    <span className="ml-2 text-[#ffcc44]/70">
                      ★ {location.difficulty}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] text-xs text-[#a09070] hover:text-white hover:border-white/[0.2] transition-all"
            >
              ✕
            </button>
          </div>

          {/* Description */}
          {isDiscovered && location.description && (
            <p className="mt-4 text-sm leading-relaxed text-[#c8b892]">
              {location.description}
            </p>
          )}

          {/* Stats row */}
          {isDiscovered && (location.npcCount != null || (location.quests && location.quests.length > 0)) && (
            <div className="mt-4 flex gap-4 text-[10px] uppercase tracking-wider text-[#a09070]">
              {location.npcCount != null && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#44ddff]/60" />
                  {location.npcCount} NPC
                </span>
              )}
              {location.quests && location.quests.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#ffcc44]/60" />
                  {location.quests.length} missioni
                </span>
              )}
            </div>
          )}

          {/* Explore button */}
          {isDiscovered && (
            <div className="mt-5">
              <button className="w-full rounded-lg border border-[#ffcc44]/30 bg-[#ffcc44]/10 py-2 text-xs font-semibold text-[#ffcc44] hover:bg-[#ffcc44]/20 transition-all">
                Esplora
              </button>
            </div>
          )}

          {/* Connected locations */}
          {connectedLocations.length > 0 && (
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#605040]">
                Luoghi collegati
              </p>
              <div className="flex flex-wrap gap-2">
                {connectedLocations.map((cl) => (
                  <button
                    key={cl.id}
                    onClick={() => onNavigate(cl.id)}
                    className="group rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-[#a09070] hover:bg-white/[0.06] hover:text-[#d4c5a9] transition-all"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full mr-1.5 align-middle opacity-40 group-hover:opacity-70 transition-opacity"
                      style={{ backgroundColor: CATEGORY_COLORS[cl.category] ?? "#88ccff" }}
                    />
                    {cl.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
