"use client";
import { motion } from "framer-motion";
import { MapLocation } from "@/types/map";

const CATEGORY_LABELS: Record<string, string> = {
  city: "Città",
  forest: "Foresta",
  dungeon: "Dungeon",
  harbor: "Porto",
  mountain: "Montagna",
  ruin: "Rovine",
  temple: "Tempio",
  shop: "Negozio",
  landmark: "Punto di Riferimento",
};

type Props = {
  location: MapLocation;
  isDiscovered: boolean;
};

export function LocationTooltip({ location, isDiscovered }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute z-40 pointer-events-none"
      style={{
        left: "50%",
        bottom: "50%",
        transform: "translate(16px, -50%)",
      }}
    >
      <div className="rounded-xl border border-white/[0.12] bg-[#0a0a12]/80 px-4 py-2.5 backdrop-blur-xl shadow-2xl shadow-black/40">
        <p className="text-sm font-bold text-[#d4c5a9] font-serif tracking-wide">
          {isDiscovered ? location.name : "???"}
        </p>
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#a09070] mt-0.5">
          {CATEGORY_LABELS[location.category] ?? location.category}
          {location.difficulty && (
            <span className="text-[#ffcc44]/70 ml-1.5">
              ★ {location.difficulty}
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}
