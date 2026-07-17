"use client";
import { memo, useMemo, useCallback, useRef } from "react";
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

const EDGE_ZONE = 40;
const MAX_SCROLL = 12;

function edgeScrollX(clientX: number, zoom: number): number {
  const w = window.innerWidth;
  if (clientX < EDGE_ZONE) {
    return -((1 - clientX / EDGE_ZONE) * MAX_SCROLL) / zoom;
  }
  if (clientX > w - EDGE_ZONE) {
    return ((1 - (w - clientX) / EDGE_ZONE) * MAX_SCROLL) / zoom;
  }
  return 0;
}

function edgeScrollY(clientY: number, zoom: number): number {
  const h = window.innerHeight;
  if (clientY < EDGE_ZONE) {
    return -((1 - clientY / EDGE_ZONE) * MAX_SCROLL) / zoom;
  }
  if (clientY > h - EDGE_ZONE) {
    return ((1 - (h - clientY) / EDGE_ZONE) * MAX_SCROLL) / zoom;
  }
  return 0;
}

export type BBox = { minX: number; minY: number; maxX: number; maxY: number };

export function bbox(polygon: [number, number][]): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

export function polygonFromBBox(b: BBox): [number, number][] {
  return [
    [b.minX, b.minY],
    [b.maxX, b.minY],
    [b.maxX, b.maxY],
    [b.minX, b.maxY],
  ];
}

type Props = {
  locations: MapLocation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onResize: (id: string, bbox: BBox) => void;
  onCameraScroll?: (dx: number, dy: number) => void;
  gridSnap: boolean;
  gridSize: number;
  camZoom: number;
};

function EditRect({
  location,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onCameraScroll,
  gridSnap,
  gridSize,
  camZoom,
}: {
  location: MapLocation;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onResize: (id: string, bbox: BBox) => void;
  onCameraScroll?: (dx: number, dy: number) => void;
  gridSnap: boolean;
  gridSize: number;
  camZoom: number;
}) {
  const box = useMemo(() => bbox(location.polygon), [location.polygon]);
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  const w = box.maxX - box.minX;
  const h = box.maxY - box.minY;
  const color = CATEGORY_COLORS[location.category] ?? "#88ccff";

  const snap = useCallback((v: number) => gridSnap ? Math.round(v / gridSize) * gridSize : v, [gridSnap, gridSize]);
  const screenToImage = useCallback((d: number) => d / camZoom, [camZoom]);

  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect(location.id);
    let lastX = e.clientX, lastY = e.clientY;
    const onEdgeScroll = (px: number, py: number) => {
      const sdx = edgeScrollX(px, camZoom);
      const sdy = edgeScrollY(py, camZoom);
      if (sdx !== 0 || sdy !== 0) {
        onCameraScroll!(sdx, sdy);
        onMove(location.id, snap(sdx), snap(sdy));
      }
    };
    const edgeInterval = onCameraScroll ? setInterval(() => {
      onEdgeScroll(lastX, lastY);
    }, 16) : null;
    const onMove_ = (ev: PointerEvent) => {
      const dx = screenToImage(ev.clientX - lastX);
      const dy = screenToImage(ev.clientY - lastY);
      lastX = ev.clientX;
      lastY = ev.clientY;
      if (onCameraScroll) onEdgeScroll(ev.clientX, ev.clientY);
      onMove(location.id, snap(dx), snap(dy));
    };
    const onUp_ = () => {
      if (edgeInterval !== null) clearInterval(edgeInterval);
      document.removeEventListener("pointermove", onMove_);
      document.removeEventListener("pointerup", onUp_);
    };
    document.addEventListener("pointermove", onMove_);
    document.addEventListener("pointerup", onUp_);
  }, [location.id, onSelect, onMove, snap, screenToImage, onCameraScroll, camZoom]);

  const onResizeStart = useCallback((e: React.PointerEvent, edges: { left?: boolean; top?: boolean; right?: boolean; bottom?: boolean }) => {
    e.stopPropagation();
    onSelect(location.id);
    const startBox = { ...box };
    let lastX = e.clientX, lastY = e.clientY;
    const edgeInterval = onCameraScroll ? setInterval(() => {
      const sdx = edgeScrollX(lastX, camZoom);
      const sdy = edgeScrollY(lastY, camZoom);
      if (sdx !== 0 || sdy !== 0) onCameraScroll(sdx, sdy);
    }, 16) : null;
    const onMove_ = (ev: PointerEvent) => {
      const dx = screenToImage(ev.clientX - lastX);
      const dy = screenToImage(ev.clientY - lastY);
      lastX = ev.clientX;
      lastY = ev.clientY;
      if (onCameraScroll) {
        const sdx = edgeScrollX(ev.clientX, camZoom);
        const sdy = edgeScrollY(ev.clientY, camZoom);
        if (sdx !== 0 || sdy !== 0) onCameraScroll(sdx, sdy);
      }
      const nb: BBox = { ...startBox };
      if (edges.left) nb.minX = snap(startBox.minX + dx);
      if (edges.right) nb.maxX = snap(startBox.maxX + dx);
      if (edges.top) nb.minY = snap(startBox.minY + dy);
      if (edges.bottom) nb.maxY = snap(startBox.maxY + dy);
      if (nb.maxX - nb.minX > 10 && nb.maxY - nb.minY > 10) {
        onResize(location.id, nb);
      }
    };
    const onUp_ = () => {
      if (edgeInterval !== null) clearInterval(edgeInterval);
      document.removeEventListener("pointermove", onMove_);
      document.removeEventListener("pointerup", onUp_);
    };
    document.addEventListener("pointermove", onMove_);
    document.addEventListener("pointerup", onUp_);
  }, [location.id, box, onSelect, onResize, snap, screenToImage, onCameraScroll, camZoom]);

  return (
    <g className="pointer-events-auto">
      {/* Clickable fill area */}
      <rect
        x={box.minX}
        y={box.minY}
        width={w}
        height={h}
        fill={`${color}18`}
        stroke={isSelected ? "#fff" : `${color}60`}
        strokeWidth={isSelected ? 2 : 1}
        strokeDasharray={isSelected ? "none" : "4 3"}
        rx={4}
        ry={4}
        style={{ cursor: isSelected ? "move" : "pointer" }}
        onPointerDown={onDragStart}
      />

      {/* Name + ID label */}
      <text
        x={box.minX + 6}
        y={box.minY + 16}
        fill={isSelected ? "#fff" : color}
        fontSize={11}
        fontFamily="sans-serif"
        fontWeight={isSelected ? "bold" : "normal"}
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)", pointerEvents: "none" }}
      >
        {location.name}
      </text>
      <text
        x={box.minX + 6}
        y={box.minY + 28}
        fill="#807060"
        fontSize={8}
        fontFamily="monospace"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)", pointerEvents: "none" }}
      >
        {location.id}
      </text>

      {/* Resize + move handles when selected */}
      {isSelected && (
        <>
          {/* Center dot */}
          <circle
            cx={cx}
            cy={cy}
            r={4}
            fill="white"
            stroke="#333"
            strokeWidth={1}
            style={{ cursor: "move" }}
            onPointerDown={onDragStart}
          />
          {/* 8 resize handles */}
          {HANDLES.map((h) => (
            <rect
              key={h.id}
              x={h.x(box) - 5}
              y={h.y(box) - 5}
              width={10}
              height={10}
              fill="white"
              stroke="#333"
              strokeWidth={1}
              rx={2}
              style={{ cursor: h.cursor }}
              onPointerDown={(e) => onResizeStart(e, h.edges)}
            />
          ))}
        </>
      )}
    </g>
  );
}

const HANDLES = [
  { id: "tl", x: (b: BBox) => b.minX, y: (b: BBox) => b.minY, cursor: "nwse-resize", edges: { left: true, top: true } as const },
  { id: "tr", x: (b: BBox) => b.maxX, y: (b: BBox) => b.minY, cursor: "nesw-resize", edges: { right: true, top: true } as const },
  { id: "bl", x: (b: BBox) => b.minX, y: (b: BBox) => b.maxY, cursor: "nesw-resize", edges: { left: true, bottom: true } as const },
  { id: "br", x: (b: BBox) => b.maxX, y: (b: BBox) => b.maxY, cursor: "nwse-resize", edges: { right: true, bottom: true } as const },
  { id: "tc", x: (b: BBox) => (b.minX + b.maxX) / 2, y: (b: BBox) => b.minY, cursor: "ns-resize", edges: { top: true } as const },
  { id: "bc", x: (b: BBox) => (b.minX + b.maxX) / 2, y: (b: BBox) => b.maxY, cursor: "ns-resize", edges: { bottom: true } as const },
  { id: "ml", x: (b: BBox) => b.minX, y: (b: BBox) => (b.minY + b.maxY) / 2, cursor: "ew-resize", edges: { left: true } as const },
  { id: "mr", x: (b: BBox) => b.maxX, y: (b: BBox) => (b.minY + b.maxY) / 2, cursor: "ew-resize", edges: { right: true } as const },
];

export const EditOverlay = memo(function EditOverlay({
  locations,
  selectedId,
  onSelect,
  onMove,
  onResize,
  onCameraScroll,
  gridSnap,
  gridSize,
  camZoom,
}: Props) {
  return (
    <g className="pointer-events-none">
      {locations.map((loc) => (
        <EditRect
          key={loc.id}
          location={loc}
          isSelected={selectedId === loc.id}
          onSelect={onSelect}
          onMove={onMove}
          onResize={onResize}
          onCameraScroll={onCameraScroll}
          gridSnap={gridSnap}
          gridSize={gridSize}
          camZoom={camZoom}
        />
      ))}
    </g>
  );
});
