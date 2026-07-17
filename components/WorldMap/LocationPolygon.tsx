"use client";
import { memo, useMemo } from "react";
import { MapLocation } from "@/types/map";
import { polygonToPath, polygonCenter } from "@/lib/mapEngine";

type Props = {
  location: MapLocation;
  isSelected: boolean;
  isHovered: boolean;
  isDiscovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  zoomLevel: number;
};

export const LocationPolygon = memo(function LocationPolygon({
  location,
  isSelected,
  isHovered,
  isDiscovered,
  onHover,
  onClick,
  zoomLevel,
}: Props) {
  const d = useMemo(() => polygonToPath(location.polygon), [location.polygon]);
  const center = useMemo(() => polygonCenter(location.polygon), [location.polygon]);
  const active = isSelected || isHovered;

  if (!location.unlocked) return null;

  const showLabel = active || zoomLevel > 0.35;
  const labelOffset =
    location.category === "city" ? -30 : location.category === "forest" ? -60 : -20;

  return (
    <g
      className="pointer-events-auto cursor-pointer"
      onPointerEnter={() => onHover(location.id)}
      onPointerLeave={() => onHover(null)}
      onClick={() => onClick(location.id)}
    >
      {/* Invisible hit area — never rendered visually */}
      <path d={d} fill="transparent" stroke="none" />

      {/* Hover glow ring */}
      {active && (
        <circle
          cx={center[0]}
          cy={center[1]}
          r={isSelected ? 70 : 50}
          fill="url(#locationGlow)"
          className={isSelected ? "animate-pulse-glow" : ""}
          style={{ transition: "r 0.35s ease-out" }}
        />
      )}

      {/* Hover border glow — faint outline along polygon */}
      {active && (
        <path
          d={d}
          fill="none"
          stroke={isSelected ? "#ffdd88" : "#ffdd8860"}
          strokeWidth={isSelected ? 2.5 : 1.5}
          strokeDasharray={isSelected ? "6 4" : "none"}
          style={{
            opacity: active ? 1 : 0,
            transition: "opacity 0.25s ease, stroke-width 0.25s ease",
            transform: `scale(${active ? 1.02 : 1})`,
            transformOrigin: `${center[0]}px ${center[1]}px`,
          }}
        />
      )}

      {/* Location name label */}
      {isDiscovered && showLabel && (
        <text
          x={center[0]}
          y={center[1] + labelOffset}
          textAnchor="middle"
          dominantBaseline="central"
          fill={active ? "#fff" : "#d4c5a9"}
          fontSize={
            active ? 19 : location.category === "city" ? 16 : location.category === "forest" ? 20 : 13
          }
          fontFamily="Georgia, serif"
          fontWeight={active ? "bold" : "normal"}
          style={{
            transition: "fill 0.2s, font-size 0.2s",
            textShadow: active
              ? "0 0 12px rgba(255,204,68,0.4), 0 2px 8px rgba(0,0,0,0.8)"
              : "0 2px 8px rgba(0,0,0,0.8)",
            pointerEvents: "none",
          }}
        >
          {location.name}
        </text>
      )}

      {/* Difficulty indicator — only on hover/select */}
      {isDiscovered && active && location.difficulty != null && (
        <text
          x={center[0]}
          y={center[1] + labelOffset + 22}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#a09070"
          fontSize={10}
          fontFamily="sans-serif"
          fontStyle="italic"
          style={{ pointerEvents: "none" }}
        >
          ★{location.difficulty}
        </text>
      )}
    </g>
  );
});
