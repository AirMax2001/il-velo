"use client";
import { useRef, useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MapLocation, CameraState, MapConfig } from "@/types/map";
import { locations as defaultLocations } from "@/data/world-locations";
import { DEFAULT_CONFIG, polygonCenter } from "@/lib/mapEngine";
import { useCamera } from "@/hooks/useCamera";
import { useMap } from "@/hooks/useMap";
import { LocationPolygon } from "./LocationPolygon";
import { LocationTooltip } from "./LocationTooltip";
import { LocationPanel } from "./LocationPanel";
import { FogLayer } from "./FogLayer";
import { CloudLayer } from "./CloudLayer";
import { Controls } from "./Controls";
import { MiniMap } from "./MiniMap";
import { WaterLayer } from "./WaterLayer";
import { ParticleLayer } from "./ParticleLayer";
import { MarkerLayer } from "./MarkerLayer";
import { EditOverlay, bbox, polygonFromBBox, BBox } from "./EditOverlay";
import { EditorPanel } from "./EditorPanel";

type Props = {
  locations?: MapLocation[];
  config?: Partial<MapConfig>;
  sessionId?: string;
  defaultEditMode?: boolean;
  onExitMap?: (location?: MapLocation | null) => void;
};

export function WorldMap({
  locations: propLocations,
  config: propConfig,
  sessionId,
  defaultEditMode = false,
  onExitMap,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 1200, h: 800 });
  const config = { ...DEFAULT_CONFIG, ...propConfig };
  const locs = propLocations ?? defaultLocations;

  const {
    state,
    moveBy,
    zoomBy,
    animateTo,
    subscribe,
    set,
    setMinZoom,
  } = useCamera(config, dims.w, dims.h);

  const {
    selected,
    selectedId,
    hovered,
    hoveredId,
    setHoveredId,
    select,
    selectAtPoint,
    discovered,
    showFog,
    setShowFog,
    getConnectedLocations,
  } = useMap(locs);

  const [cam, setCam] = useState<CameraState>({ ...state.current });
  useEffect(() => subscribe(setCam), [subscribe]);
  const camRef = useRef(cam);
  camRef.current = cam;

  const [panelVisible, setPanelVisible] = useState(false);
  const panelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parallaxRef = useRef({ x: 0, y: 0 });
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // ── Edit mode state ──
  const [isEditing, setIsEditing] = useState(defaultEditMode);
  const [editSelectedId, setEditSelectedId] = useState<string | null>(null);
  const [gridSnap, setGridSnap] = useState(false);
  const [editLocations, setEditLocations] = useState<MapLocation[]>(locs);

  // Sync editLocations when locs change
  useEffect(() => {
    setEditLocations(locs);
  }, [locs]);

  const imageFilters = {
    contrast: 1 + (cam.zoom - 0.4) * 0.15,
    brightness: 1 + (cam.zoom - 0.4) * 0.1,
    saturate: 1 + (cam.zoom - 0.4) * 0.12,
  };

  useEffect(() => {
    parallaxRef.current = {
      x: cam.x - config.imageWidth / 2,
      y: cam.y - config.imageHeight / 2,
    };
    const timeout = setTimeout(() => {
      setParallaxOffset({ ...parallaxRef.current });
    }, 16);
    return () => clearTimeout(timeout);
  }, [cam.x, cam.y, config.imageWidth, config.imageHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let first = true;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDims({ w: width, h: height });
      if (first) {
        first = false;
        const fitZoom = Math.min(width / config.imageWidth, height / config.imageHeight);
        setMinZoom(fitZoom);
        set({ zoom: fitZoom, x: config.imageWidth / 2, y: config.imageHeight / 2 });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Pointer handling ──
  const drag = useRef({ on: false, sx: 0, sy: 0, moved: false });

  const onCameraScroll = useCallback((dx: number, dy: number) => {
    set({ x: camRef.current.x + dx, y: camRef.current.y + dy });
  }, [set]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    drag.current = { on: true, sx: e.clientX, sy: e.clientY, moved: false };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current.on) return;
      const dx = e.clientX - drag.current.sx;
      const dy = e.clientY - drag.current.sy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true;
      moveBy(dx, dy);
      drag.current.sx = e.clientX;
      drag.current.sy = e.clientY;
    },
    [moveBy, isEditing]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const wasMoved = drag.current.moved;
      drag.current.on = false;
      if (!wasMoved && !isEditing) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const svgX = (e.clientX - rect.left - dims.w / 2) / cam.zoom + cam.x;
        const svgY = (e.clientY - rect.top - dims.h / 2) / cam.zoom + cam.y;
        const found = selectAtPoint(svgX, svgY);
        if (!found && selectedId) {
          select(null);
          const fitZoom = Math.min(dims.w / config.imageWidth, dims.h / config.imageHeight);
          animateTo({ x: config.imageWidth / 2, y: config.imageHeight / 2, zoom: fitZoom });
          setPanelVisible(false);
        }
      }
    },
    [cam, dims, selectAtPoint, isEditing, selectedId, select, animateTo, config, setPanelVisible]
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = (e.clientX - rect.left - dims.w / 2) / cam.zoom + cam.x;
      const cy = (e.clientY - rect.top - dims.h / 2) / cam.zoom + cam.y;
      zoomBy(e.deltaY < 0 ? 0.03 : -0.03, cx, cy);
    },
    [cam, dims, zoomBy, isEditing]
  );

  // ── Location focus (normal mode) ──
  const focusLocation = useCallback(
    (id: string) => {
      const loc = locs.find((l) => l.id === id);
      if (!loc) return;
      const [cx, cy] = polygonCenter(loc.polygon);
      animateTo({ x: cx, y: cy, zoom: loc.zoom ?? config.defaultLocationZoom });
      setPanelVisible(false);
      if (panelTimer.current) clearTimeout(panelTimer.current);
      panelTimer.current = setTimeout(() => {
        setPanelVisible(true);
      }, 300);
      select(id);
      // Update current location on the table display
      if (sessionId && loc.name) {
        fetch(`/api/locations?sessionId=${sessionId}`)
          .then(r => r.json())
          .then(d => {
            const dbLoc = (d.locations || []).find(
              (l: any) => l.external_id === id || l.name === loc.name
            );
            if (dbLoc?.id) {
              fetch("/api/state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, locationId: dbLoc.id }),
              });
            }
          })
          .catch(() => {});
      }
    },
    [locs, animateTo, select, config, sessionId]
  );

  const closePanel = useCallback(() => {
    setPanelVisible(false);
    select(null);
  }, [select]);

  // ── Edit mode handlers ──
  const toggleEditMode = useCallback(() => {
    setIsEditing((v) => !v);
    setEditSelectedId(null);
    select(null);
    setPanelVisible(false);
  }, [select]);

  const handleEditMove = useCallback((id: string, dx: number, dy: number) => {
    setEditLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== id) return loc;
        return {
          ...loc,
          polygon: loc.polygon.map(([x, y]) => [x + dx, y + dy] as [number, number]),
        };
      })
    );
  }, []);

  const handleEditResize = useCallback((id: string, newBox: BBox) => {
    setEditLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== id) return loc;
        const oldBox = bbox(loc.polygon);
        const oldCx = (oldBox.minX + oldBox.maxX) / 2;
        const oldCy = (oldBox.minY + oldBox.maxY) / 2;
        const newCx = (newBox.minX + newBox.maxX) / 2;
        const newCy = (newBox.minY + newBox.maxY) / 2;
        const sx = (newBox.maxX - newBox.minX) / (oldBox.maxX - oldBox.minX || 1);
        const sy = (newBox.maxY - newBox.minY) / (oldBox.maxY - oldBox.minY || 1);
        return {
          ...loc,
          polygon: loc.polygon.map(([x, y]) => [
            (x - oldCx) * sx + newCx,
            (y - oldCy) * sy + newCy,
          ] as [number, number]),
        };
      })
    );
  }, []);

  const handleEditSelect = useCallback((id: string | null) => {
    setEditSelectedId(id);
  }, []);

  const handleEditFocus = useCallback((id: string) => {
    const loc = editLocations.find((l) => l.id === id);
    if (loc) {
      const [cx, cy] = polygonCenter(loc.polygon);
      animateTo({ x: cx, y: cy, zoom: loc.zoom ?? config.defaultLocationZoom });
    }
  }, [editLocations, animateTo, config]);

  const handleSave = useCallback(() => {
    const output: Record<string, [number, number][]> = {};
    for (const loc of editLocations) {
      output[loc.id] = loc.polygon;
    }
    const json = JSON.stringify(output, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "world-layout.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [editLocations]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-30 overflow-hidden bg-[#0a0a12]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => { drag.current.on = false; }}
      onWheel={onWheel}
      style={{ touchAction: "none" }}
    >
      {/* Map image + water */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: config.imageWidth,
          height: config.imageHeight,
          transform: `translate(${dims.w / 2}px, ${dims.h / 2}px) scale(${cam.zoom}) translate(-${cam.x}px, -${cam.y}px)`,
          transformOrigin: "0 0",
          willChange: "transform",
          filter: `contrast(${imageFilters.contrast}) brightness(${imageFilters.brightness}) saturate(${imageFilters.saturate})`,
        }}
      >
        <img
          src={config.imagePath}
          alt="World Map"
          draggable={false}
          style={{ width: "100%", height: "100%" }}
        />
        <WaterLayer />
      </div>

      {/* SVG overlay layer */}
      <svg
        className="pointer-events-none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: config.imageWidth,
          height: config.imageHeight,
          transform: `translate(${dims.w / 2}px, ${dims.h / 2}px) scale(${cam.zoom}) translate(-${cam.x}px, -${cam.y}px)`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="locationGlow">
            <stop offset="0%" stopColor="#ffdd88" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffdd88" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Fog of war (hidden in edit mode) */}
        {!isEditing && showFog && (
          <FogLayer
            locations={locs}
            discovered={discovered}
            imageW={config.imageWidth}
            imageH={config.imageHeight}
            parallaxOffset={parallaxOffset}
          />
        )}

        {/* Normal mode: invisible polygons */}
        {!isEditing && locs
          .filter((l) => l.unlocked)
          .map((loc) => (
            <LocationPolygon
              key={loc.id}
              location={loc}
              isSelected={selectedId === loc.id}
              isHovered={hoveredId === loc.id}
              isDiscovered={discovered.has(loc.id)}
              onHover={setHoveredId}
              onClick={focusLocation}
              zoomLevel={cam.zoom}
            />
          ))}

        {/* Edit mode: visible rects with handles */}
        {isEditing && (
          <EditOverlay
            locations={editLocations}
            selectedId={editSelectedId}
            onSelect={handleEditSelect}
            onMove={handleEditMove}
            onResize={handleEditResize}
            onCameraScroll={onCameraScroll}
            gridSnap={gridSnap}
            gridSize={20}
            camZoom={cam.zoom}
          />
        )}

        <MarkerLayer markers={[]} zoomLevel={cam.zoom} />
      </svg>

      {/* Atmosphere layers */}
      <ParticleLayer />
      <CloudLayer parallaxOffset={parallaxOffset} />

      {/* Top-right buttons — always above editor panel */}
      <div className="fixed top-4 right-4 z-[60] flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
        {onExitMap && (
          <button
            onClick={() => onExitMap(selected)}
            className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-1.5 text-[10px] text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            Mostra scena
          </button>
        )}
        <button
          onClick={toggleEditMode}
          className={`rounded-lg border px-3 py-1.5 text-xs font-mono tracking-wider transition-all ${
            isEditing
              ? "border-[#ffcc44]/40 bg-[#ffcc44]/10 text-[#ffcc44]"
              : "border-white/[0.08] bg-black/40 text-[#807060] hover:bg-white/10 hover:text-white"
          }`}
        >
          {isEditing ? "✕ Esci" : "⌨ Modifica Display"}
        </button>
      </div>

      {/* UI controls always visible */}
      <Controls
        onZoomIn={() => zoomBy(0.08, cam.x, cam.y)}
        onZoomOut={() => zoomBy(-0.08, cam.x, cam.y)}
        onReset={() => animateTo({ x: config.imageWidth / 2, y: config.imageHeight / 2, zoom: config.initialZoom })}
        zoomLevel={cam.zoom}
      />
      <MiniMap
        camera={cam}
        config={config}
        dims={dims}
        locations={locs}
        discovered={discovered}
        selectedId={selectedId}
        onNavigate={(x, y) => animateTo({ x, y, zoom: cam.zoom })}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {!isEditing && hovered && (
          <LocationTooltip
            location={hovered}
            isDiscovered={discovered.has(hovered.id)}
          />
        )}
      </AnimatePresence>

      {/* Location panel */}
      {!isEditing && selected && panelVisible && (
        <LocationPanel
          location={selected}
          isDiscovered={discovered.has(selected.id)}
          connectedLocations={getConnectedLocations(selected.id)}
          onClose={closePanel}
          onNavigate={focusLocation}
        />
      )}

      {/* Editor panel */}
      {isEditing && (
        <EditorPanel
          locations={editLocations}
          selectedEditId={editSelectedId}
          onSelectEdit={handleEditSelect}
          onEditModeToggle={toggleEditMode}
          onSave={handleSave}
          isEditing={isEditing}
          gridSnap={gridSnap}
          onGridSnapToggle={() => setGridSnap((v) => !v)}
          onFocusLocation={handleEditFocus}
        />
      )}
    </div>
  );
}
