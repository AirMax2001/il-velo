"use client";
import { useMemo } from "react";
import { CameraState, MapConfig, MapLocation } from "@/types/map";

type Props = {
  camera: CameraState;
  config: MapConfig;
  dims: { w: number; h: number };
  locations: MapLocation[];
  discovered: Set<string>;
  selectedId: string | null;
  onNavigate: (x: number, y: number) => void;
};

const MINI_W = 180;
const MINI_H = 120;
const MINI_SCALE = MINI_W / 3840;

export function MiniMap({
  camera,
  config,
  dims,
  locations,
  discovered,
  selectedId,
  onNavigate,
}: Props) {
  const viewW = dims.w / camera.zoom;
  const viewH = dims.h / camera.zoom;

  const viewX = (camera.x - viewW / 2) * MINI_SCALE;
  const viewY = (camera.y - viewH / 2) * MINI_SCALE;
  const vw = viewW * MINI_SCALE;
  const vh = viewH * MINI_SCALE;

  return (
    <div
      className="absolute right-6 top-6 z-40 rounded-lg border border-white/[0.08] bg-[#0a0a12]/80 overflow-hidden backdrop-blur-md shadow-xl"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <svg
        width={MINI_W}
        height={MINI_H}
        viewBox={`0 0 ${config.imageWidth * MINI_SCALE} ${config.imageHeight * MINI_SCALE}`}
        className="block"
      >
        {/* Background */}
        <rect
          x="0"
          y="0"
          width={config.imageWidth * MINI_SCALE}
          height={config.imageHeight * MINI_SCALE}
          fill="#1a1a24"
        />

        {/* Location dots */}
        {locations
          .filter((l) => l.unlocked && discovered.has(l.id))
          .map((loc) => {
            const cx =
              (loc.polygon.reduce((s, p) => s + p[0], 0) / loc.polygon.length) *
              MINI_SCALE;
            const cy =
              (loc.polygon.reduce((s, p) => s + p[1], 0) / loc.polygon.length) *
              MINI_SCALE;
            return (
              <circle
                key={loc.id}
                cx={cx}
                cy={cy}
                r={2}
                fill={selectedId === loc.id ? "#ffcc44" : "#605040"}
                className="cursor-pointer"
                onClick={() => {
                  const ox =
                    loc.polygon.reduce((s, p) => s + p[0], 0) /
                    loc.polygon.length;
                  const oy =
                    loc.polygon.reduce((s, p) => s + p[1], 0) /
                    loc.polygon.length;
                  onNavigate(ox, oy);
                }}
              />
            );
          })}

        {/* Viewport indicator */}
        <rect
          x={viewX}
          y={viewY}
          width={vw}
          height={vh}
          fill="none"
          stroke="#ffdd88"
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>

      <div className="border-t border-white/[0.06] px-2 py-1 text-[8px] uppercase tracking-wider text-[#504030] text-center">
        Mappa
      </div>
    </div>
  );
}
