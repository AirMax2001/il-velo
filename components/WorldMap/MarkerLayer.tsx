"use client";
import { memo } from "react";
import { MapMarker } from "@/types/map";

const MARKER_ICONS: Record<string, string> = {
  quest: "!",
  npc: "●",
  combat: "⚔",
  merchant: "¤",
  boss: "♦",
  player: "▼",
  event: "★",
};

const MARKER_COLORS: Record<string, string> = {
  quest: "#ffcc44",
  npc: "#44ddff",
  combat: "#ff6644",
  merchant: "#44cc66",
  boss: "#ff44aa",
  player: "#ffffff",
  event: "#ff8844",
};

type Props = {
  markers: MapMarker[];
  zoomLevel: number;
};

export const MarkerLayer = memo(function MarkerLayer({ markers, zoomLevel }: Props) {
  if (!markers.length) return null;

  return (
    <g className="pointer-events-auto">
      {markers
        .filter((m) => {
          if (!m.visible) return false;
          if (m.zoomRange) {
            if (zoomLevel < m.zoomRange[0] || zoomLevel > m.zoomRange[1]) return false;
          }
          return true;
        })
        .map((marker) => {
          const icon = MARKER_ICONS[marker.type] ?? "?";
          const color = MARKER_COLORS[marker.type] ?? "#88ccff";
          return (
            <g key={marker.id}>
              <circle
                cx={marker.x}
                cy={marker.y}
                r={marker.pulse ? 16 : 10}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                opacity={marker.pulse ? 0.3 : 0}
                className={marker.pulse ? "animate-ping-slow" : ""}
              />
              <text
                x={marker.x}
                y={marker.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontSize={14}
                style={{
                  textShadow: `0 0 8px ${color}80, 0 2px 4px rgba(0,0,0,0.8)`,
                  cursor: "pointer",
                }}
              >
                {icon}
              </text>
              {marker.label && zoomLevel > 0.5 && (
                <text
                  x={marker.x}
                  y={marker.y + 18}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#d4c5a9"
                  fontSize={9}
                  fontFamily="sans-serif"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
                >
                  {marker.label}
                </text>
              )}
            </g>
          );
        })}
    </g>
  );
});
