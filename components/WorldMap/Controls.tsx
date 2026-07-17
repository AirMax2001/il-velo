"use client";
import { getZoomLevel } from "@/lib/mapEngine";

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel: number;
};

export function Controls({ onZoomIn, onZoomOut, onReset, zoomLevel }: Props) {
  const level = getZoomLevel(zoomLevel);
  const label = level === "world" ? "MONDO" : level === "region" ? "REGIONE" : "LOCALE";

  return (
    <>
      {/* Zoom controls */}
      <div
        className="absolute bottom-6 right-6 z-40 flex flex-col gap-1.5"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={onZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-black/50 text-sm text-white/80 hover:bg-black/70 backdrop-blur-md transition-all"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-black/50 text-sm text-white/80 hover:bg-black/70 backdrop-blur-md transition-all"
        >
          −
        </button>
        <button
          onClick={onReset}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-black/50 text-xs text-white/60 hover:bg-black/70 backdrop-blur-md transition-all"
        >
          ⌂
        </button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-6 right-20 z-40 text-[9px] tracking-widest text-[#605040] font-mono"
        onPointerDown={(e) => e.stopPropagation()}>
        {label}
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 60%, rgba(10,10,18,0.6) 100%)",
        }}
      />
    </>
  );
}
