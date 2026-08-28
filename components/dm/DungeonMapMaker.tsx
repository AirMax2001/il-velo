"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { subscribeToTable } from "@/lib/supabaseClient";

// ─── Tipi Gerarchici e Strutturati per D&D Campaign Studio ────────────────────
export type MapLevelMode = "world" | "location" | "battlegrid";

export type MapLocationPin = {
  id: string;
  name: string;
  description: string;
  x: number; // percentuale 0-100 o coordinate griglia
  y: number;
  icon: string; // emoji o tipo
  targetMapId?: string; // ID della sottolocazione o stanza
  sceneImage?: string;
  hasCombat?: boolean;
};

export type LayerType = "floors" | "walls" | "objects" | "pins" | "notes";
export type FloorStyle = "stone_blocks" | "stone_dark" | "flagstone" | "wood_planks" | "cobblestone" | "dirt" | "grass" | "water" | "lava" | "void";
export type WallStyle = "solid_black" | "stone_wall" | "cave_wall" | "double_line" | "iron_bars";
export type ObjectType = "door" | "secret_door" | "stairs_up" | "stairs_down" | "chest" | "table" | "chair" | "pillar" | "altar" | "torch" | "trap_spikes" | "tree";
export type ToolType = "brush" | "rect" | "circle" | "line" | "fill" | "erase" | "object" | "pin" | "eyedropper" | "measure";

export type MapObject = {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  rotation?: number;
  label?: string;
};

export type Token = {
  id: string;
  name: string;
  type: "player" | "enemy" | "prop" | "boss";
  x: number;
  y: number;
  hp_current?: number;
  hp_max?: number;
  color?: string;
};

const DEFAULT_W = 50;
const DEFAULT_H = 38;
const BASE_CELL = 32;

export const FLOOR_STYLES: { id: FloorStyle; label: string; icon: string }[] = [
  { id: "stone_blocks", label: "Pietra Dungeon", icon: "🧱" },
  { id: "flagstone", label: "Lastre", icon: "🔳" },
  { id: "wood_planks", label: "Legno Interni", icon: "🪵" },
  { id: "cobblestone", label: "Ciottolato", icon: "🏛️" },
  { id: "dirt", label: "Terra / Sentiero", icon: "🟤" },
  { id: "grass", label: "Prato Esterno", icon: "🌿" },
  { id: "water", label: "Acqua / Fiume", icon: "💧" },
  { id: "lava", label: "Lava / Magma", icon: "🌋" },
  { id: "void", label: "Vuoto / Abisso", icon: "🕳️" },
];

export const WALL_STYLES: { id: WallStyle; label: string; icon: string }[] = [
  { id: "solid_black", label: "Muro Pieno", icon: "⬛" },
  { id: "stone_wall", label: "Muro di Pietra", icon: "🧱" },
  { id: "cave_wall", label: "Caverna Naturale", icon: "🪨" },
  { id: "double_line", label: "Doppia Linea", icon: "⏸️" },
  { id: "iron_bars", label: "Sbarre di Ferro", icon: "⛓️" },
];

export const OBJECT_CATALOG: { type: ObjectType; label: string; icon: string }[] = [
  { type: "door", label: "Porta", icon: "🚪" },
  { type: "secret_door", label: "Porta Segreta", icon: "🧱" },
  { type: "stairs_up", label: "Scale Su", icon: "🪜" },
  { type: "stairs_down", label: "Scale Giù", icon: "🕳️" },
  { type: "chest", label: "Baule Tesoro", icon: "📦" },
  { type: "table", label: "Tavolo", icon: "🪵" },
  { type: "chair", label: "Sedia / Trono", icon: "🪑" },
  { type: "pillar", label: "Pilastro", icon: "🏛️" },
  { type: "altar", label: "Altare Magico", icon: "✨" },
  { type: "torch", label: "Torcia Luce", icon: "🔥" },
  { type: "trap_spikes", label: "Trappola Spine", icon: "⚠️" },
  { type: "tree", label: "Albero", icon: "🌳" },
];

// ─── Render Canvas Funzionale & Pulito ───────────────────────────────────────
export function renderCleanMap(
  ctx: CanvasRenderingContext2D,
  mode: MapLevelMode,
  tiles: Record<string, string>,
  walls: Record<string, string>,
  objects: MapObject[],
  pins: MapLocationPin[],
  tokens: Token[],
  gridW: number,
  gridH: number,
  cellSize: number,
  panX: number,
  panY: number,
  canvasW: number,
  canvasH: number,
  showGrid: boolean,
  previewCells?: Set<string>,
  onPinClick?: (pin: MapLocationPin) => void
) {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = mode === "world" ? "#060910" : "#080b12";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const startX = Math.max(0, Math.floor(-panX / cellSize) - 2);
  const startY = Math.max(0, Math.floor(-panY / cellSize) - 2);
  const endX = Math.min(gridW - 1, Math.ceil((canvasW - panX) / cellSize) + 2);
  const endY = Math.min(gridH - 1, Math.ceil((canvasH - panY) / cellSize) + 2);

  // 1. Pavimenti
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const key = `${x},${y}`;
      const fl = tiles[key];
      const px = panX + x * cellSize;
      const py = panY + y * cellSize;

      if (fl) {
        ctx.fillStyle = fl === "water" ? "#0c2038" : fl === "lava" ? "#8a1a05" : fl === "wood_planks" ? "#362211" : "#1b1f28";
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cellSize, cellSize);
      } else if (mode === "world") {
        // Sfondo mappa mondo texture leggera
        ctx.fillStyle = "rgba(20, 25, 38, 0.3)";
        ctx.fillRect(px, py, cellSize, cellSize);
      }
    }
  }

  // 2. Muri
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const key = `${x},${y}`;
      const wl = walls[key];
      const px = panX + x * cellSize;
      const py = panY + y * cellSize;

      if (wl) {
        ctx.fillStyle = "#111318";
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = Math.max(1.5, cellSize * 0.08);
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
    }
  }

  // 3. Griglia Tattica
  if (showGrid && cellSize >= 12) {
    ctx.strokeStyle = mode === "world" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const px = panX + x * cellSize;
        const py = panY + y * cellSize;
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
    }
  }

  // 4. Preview
  if (previewCells) {
    ctx.fillStyle = "rgba(201, 164, 76, 0.35)";
    ctx.strokeStyle = "rgba(201, 164, 76, 0.9)";
    ctx.lineWidth = 1.5;
    for (const k of previewCells) {
      const [x, y] = k.split(",").map(Number);
      const px = panX + x * cellSize;
      const py = panY + y * cellSize;
      ctx.fillRect(px, py, cellSize, cellSize);
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }

  // 5. Oggetti
  for (const obj of objects) {
    const px = panX + obj.x * cellSize;
    const py = panY + obj.y * cellSize;
    if (px < -cellSize || px > canvasW || py < -cellSize || py > canvasH) continue;

    ctx.save();
    ctx.translate(px + cellSize / 2, py + cellSize / 2);
    ctx.font = `${Math.max(12, cellSize * 0.5)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const item = OBJECT_CATALOG.find(i => i.type === obj.type);
    const icon = item ? item.icon : "📦";

    ctx.fillStyle = "rgba(10, 12, 16, 0.9)";
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c9a44c";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillText(icon, 0, 0);
    ctx.restore();
  }

  // 6. Pin / Punti di Interesse (Mappa Mondo -> Cliccabili per aprire Scene)
  for (const pin of pins) {
    const px = panX + pin.x * cellSize;
    const py = panY + pin.y * cellSize;
    if (px < -cellSize || px > canvasW || py < -cellSize || py > canvasH) continue;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = pin.hasCombat ? "#ef4444" : "#c9a44c";
    ctx.beginPath();
    ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `${Math.max(12, cellSize * 0.45)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pin.icon || "📍", px + cellSize / 2, py + cellSize / 2);

    // Etichetta Pin
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(px - 10, py - 20, cellSize + 20, 16);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pin.name, px + cellSize / 2, py - 12);
    ctx.restore();
  }

  // 7. Token Combattimento
  for (const t of tokens) {
    const px = panX + t.x * cellSize;
    const py = panY + t.y * cellSize;
    if (px < -cellSize || px > canvasW || py < -cellSize || py > canvasH) continue;

    const cx = px + cellSize / 2;
    const cy = py + cellSize / 2;
    const r = cellSize * 0.42;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#07090e";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = t.color || (t.type === "player" ? "#3b82f6" : t.type === "enemy" ? "#ef4444" : "#c9a44c");
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.max(9, cellSize * 0.3)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t.name.substring(0, 2).toUpperCase(), cx, cy);
    ctx.restore();
  }
}

// ─── Componente Principale DungeonMapMaker (Gerarchico & Funzionale) ───────────
export function DungeonMapMaker({ sessionId }: { sessionId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  
  // Livello di visualizzazione gerarchico (Mappa Mondo -> Location/Stanza -> Combattimento)
  const [mapMode, setMapMode] = useState<MapLevelMode>("location");
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);

  const [gridW, setGridW] = useState(DEFAULT_W);
  const [gridH, setGridH] = useState(DEFAULT_H);

  const [tiles, setTiles] = useState<Record<string, string>>({});
  const [walls, setWalls] = useState<Record<string, string>>({});
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [pins, setPins] = useState<MapLocationPin[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);

  // Strumenti UI
  const [activeLayer, setActiveLayer] = useState<LayerType>("floors");
  const [activeTool, setActiveTool] = useState<ToolType>("brush");
  const [activeFloorStyle, setActiveFloorStyle] = useState<FloorStyle>("stone_blocks");
  const [activeWallStyle, setActiveWallStyle] = useState<WallStyle>("solid_black");
  const [activeObjectType, setActiveObjectType] = useState<ObjectType>("door");
  const [brushSize, setBrushSize] = useState<number>(2);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Zoom & Pan
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });

  // Modal Scena / Dettaglio Pin Cliccato
  const [selectedPin, setSelectedPin] = useState<MapLocationPin | null>(null);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // Refs per closure
  const tilesRef = useRef(tiles);
  const wallsRef = useRef(walls);
  const objectsRef = useRef(objects);
  const pinsRef = useRef(pins);
  const tokensRef = useRef(tokens);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const gridWRef = useRef(gridW);
  const gridHRef = useRef(gridH);

  tilesRef.current = tiles;
  wallsRef.current = walls;
  objectsRef.current = objects;
  pinsRef.current = pins;
  tokensRef.current = tokens;
  zoomRef.current = zoom;
  panRef.current = pan;
  gridWRef.current = gridW;
  gridHRef.current = gridH;

  // Caricamento Dati
  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/battlemap?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.battlemap) {
        setGridW(data.battlemap.grid_width || DEFAULT_W);
        setGridH(data.battlemap.grid_height || DEFAULT_H);
        setTiles(data.battlemap.tiles || {});
        setWalls(data.battlemap.walls || {});
        setObjects(data.battlemap.objects || []);
        setPins(data.battlemap.pins || [
          { id: "1", name: "Taverna del Drago", description: "Punto di partenza della storia.", x: 10, y: 10, icon: "🍺" },
          { id: "2", name: "Rovine Sotterranee", description: "Dungeon principale infestato da goblin.", x: 30, y: 20, icon: "💀", hasCombat: true },
        ]);
        setTokens(data.battlemap.tokens || []);
      }
    } catch {}
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    loadData();
    const unsub = subscribeToTable("battlemap_state", sessionId, loadData);
    return () => unsub();
  }, [sessionId, loadData]);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const saveState = useCallback((
    t: Record<string, string>,
    w: Record<string, string>,
    o: MapObject[],
    p: MapLocationPin[],
    tk: Token[]
  ) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/battlemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          grid_width: gridWRef.current,
          grid_height: gridHRef.current,
          tiles: t,
          walls: w,
          objects: o,
          pins: p,
          tokens: tk,
        }),
      });
    }, 400);
  }, [sessionId]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    renderCleanMap(
      ctx,
      mapMode,
      tiles,
      walls,
      objects,
      pins,
      tokens,
      gridW,
      gridH,
      BASE_CELL * zoom,
      pan.x,
      pan.y,
      canvas.width,
      canvas.height,
      showGrid,
      undefined,
      (pin) => {
        setSelectedPin(pin);
        setShowPinModal(true);
      }
    );
  }, [tiles, walls, objects, pins, tokens, gridW, gridH, zoom, pan, showGrid, mapMode]);

  const pixelToCell = (px: number, py: number): [number, number] => {
    const cellSize = BASE_CELL * zoomRef.current;
    const p = panRef.current;
    return [
      Math.max(0, Math.min(gridWRef.current - 1, Math.floor((px - p.x) / cellSize))),
      Math.max(0, Math.min(gridHRef.current - 1, Math.floor((py - p.y) / cellSize))),
    ];
  };

  const relPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.altKey) {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...panRef.current };
      return;
    }

    const pos = relPos(e);
    const [cx, cy] = pixelToCell(pos.x, pos.y);

    if (activeLayer === "pins" && activeTool === "pin") {
      const name = prompt("Nome della Location / Scena:");
      if (!name) return;
      const newPin: MapLocationPin = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        description: "Scena creata per la storia.",
        x: cx,
        y: cy,
        icon: "📍",
      };
      const nextPins = [...pinsRef.current, newPin];
      setPins(nextPins);
      saveState(tilesRef.current, wallsRef.current, objectsRef.current, nextPins, tokensRef.current);
      return;
    }

    if (activeTool === "brush" || activeTool === "erase") {
      isDrawing.current = true;
      const half = Math.floor(brushSize / 2);
      const nextTiles = { ...tilesRef.current };
      const nextWalls = { ...wallsRef.current };

      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < gridWRef.current && ny >= 0 && ny < gridHRef.current) {
            const k = `${nx},${ny}`;
            if (activeLayer === "floors") {
              if (activeTool === "erase") delete nextTiles[k]; else nextTiles[k] = activeFloorStyle;
            } else if (activeLayer === "walls") {
              if (activeTool === "erase") delete nextWalls[k]; else nextWalls[k] = activeWallStyle;
            }
          }
        }
      }
      setTiles(nextTiles);
      setWalls(nextWalls);
    } else if (activeTool === "object") {
      const newObj: MapObject = {
        id: Math.random().toString(36).substring(2, 9),
        type: activeObjectType,
        x: cx,
        y: cy,
        rotation: 0,
      };
      const nextObjs = [...objectsRef.current, newObj];
      setObjects(nextObjs);
      saveState(tilesRef.current, wallsRef.current, nextObjs, pinsRef.current, tokensRef.current);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning.current) {
      setPan({
        x: panOrigin.current.x + (e.clientX - panStart.current.x),
        y: panOrigin.current.y + (e.clientY - panStart.current.y),
      });
      return;
    }
    if (!isDrawing.current) return;
    const pos = relPos(e);
    const [cx, cy] = pixelToCell(pos.x, pos.y);
    if (activeTool === "brush" || activeTool === "erase") {
      const half = Math.floor(brushSize / 2);
      const nextTiles = { ...tilesRef.current };
      const nextWalls = { ...wallsRef.current };
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < gridWRef.current && ny >= 0 && ny < gridHRef.current) {
            const k = `${nx},${ny}`;
            if (activeLayer === "floors") {
              if (activeTool === "erase") delete nextTiles[k]; else nextTiles[k] = activeFloorStyle;
            } else if (activeLayer === "walls") {
              if (activeTool === "erase") delete nextWalls[k]; else nextWalls[k] = activeWallStyle;
            }
          }
        }
      }
      setTiles(nextTiles);
      setWalls(nextWalls);
    }
  };

  const handleMouseUp = () => {
    if (isPanning.current) { isPanning.current = false; return; }
    if (isDrawing.current) {
      isDrawing.current = false;
      saveState(tilesRef.current, wallsRef.current, objectsRef.current, pinsRef.current, tokensRef.current);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-white/40">Caricamento Editor Mappe Gerarchico...</div>;
  }

  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07090f] select-none text-white">
      {/* ── Toolbar Laterale Ottimizzata ─────────────────────────────────── */}
      <div className="flex w-68 shrink-0 flex-col gap-3 overflow-y-auto border-r border-white/[0.08] bg-[#0a0d14] p-3.5 text-xs">
        
        {/* Modalità Livello Mappa (Mappa Mondo vs Location vs Combattimento) */}
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-white/40 font-bold">Tipo di Mappa / Storia</p>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: "world", label: "🌍 Mondo", mode: "world" },
              { id: "location", label: "🏛️ Stanza", mode: "location" },
              { id: "battlegrid", label: "⚔️ Fight", mode: "battlegrid" },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMapMode(m.mode as MapLevelMode)}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                  mapMode === m.mode
                    ? "bg-veil-gold text-black shadow"
                    : "bg-white/[0.03] text-white/60 hover:bg-white/[0.06]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/[0.08]" />

        {/* Livelli di Disegno */}
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-white/40 font-bold">Livello Attivo</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { id: "floors", label: "🎨 Pavimenti", icon: "⬛" },
              { id: "walls", label: "🧱 Muri", icon: "🏛️" },
              { id: "objects", label: "📦 Arredi", icon: "🚪" },
              { id: "pins", label: "📍 Scene / Pin", icon: "📌" },
            ].map(l => (
              <button
                key={l.id}
                onClick={() => {
                  setActiveLayer(l.id as LayerType);
                  if (l.id === "pins") setActiveTool("pin");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                  activeLayer === l.id
                    ? "bg-veil-gold/20 text-veil-gold border border-veil-gold/40"
                    : "bg-white/[0.03] text-white/60 hover:bg-white/[0.06]"
                }`}
              >
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Strumenti */}
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-white/40 font-bold">Strumento</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { id: "brush", label: "✏️ Pennello", tool: "brush" },
              { id: "erase", label: "🧹 Gomma", tool: "erase" },
              { id: "object", label: "📦 Oggetto", tool: "object" },
              { id: "pin", label: "📍 Crea Scena", tool: "pin" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.tool as ToolType)}
                className={`rounded-lg px-2.5 py-1.5 text-left font-medium transition ${
                  activeTool === t.tool
                    ? "bg-veil-gold/20 text-veil-gold border border-veil-gold/30"
                    : "bg-white/[0.03] text-white/60 hover:bg-white/[0.06]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/[0.08]" />

        {/* Palette in base al layer attivo */}
        {activeLayer === "floors" && (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-white/40 font-bold">Materiale Pavimento</p>
            <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
              {FLOOR_STYLES.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFloorStyle(f.id)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                    activeFloorStyle === f.id ? "bg-veil-gold/20 text-veil-gold border border-veil-gold/30" : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeLayer === "walls" && (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-white/40 font-bold">Stile Muro</p>
            <div className="flex flex-col gap-1">
              {WALL_STYLES.map(w => (
                <button
                  key={w.id}
                  onClick={() => setActiveWallStyle(w.id)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                    activeWallStyle === w.id ? "bg-veil-gold/20 text-veil-gold border border-veil-gold/30" : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <span>{w.icon}</span>
                  <span>{w.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeLayer === "objects" && (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-white/40 font-bold">Oggetto Arredo</p>
            <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
              {OBJECT_CATALOG.map(o => (
                <button
                  key={o.type}
                  onClick={() => { setActiveObjectType(o.type); setActiveTool("object"); }}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                    activeObjectType === o.type && activeTool === "object" ? "bg-veil-gold/20 text-veil-gold border border-veil-gold/30" : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <span>{o.icon}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Elenco Scene / Pin registrati */}
        <div className="mt-2">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-veil-gold font-bold">📍 Scene & Luoghi ({pins.length})</p>
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
            {pins.map(pin => (
              <div key={pin.id} className="flex items-center justify-between bg-black/40 border border-white/5 px-2 py-1 rounded text-[11px]">
                <span className="truncate">{pin.icon} {pin.name}</span>
                <button
                  onClick={() => { setSelectedPin(pin); setShowPinModal(true); }}
                  className="text-veil-gold hover:underline text-[10px]"
                >
                  Apri Scena ↗
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Area Canvas ─────────────────────────────────────────────────── */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-[#040609]">
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={e => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.15 : 0.87;
            setZoom(z => Math.min(4, Math.max(0.3, z * factor)));
          }}
          onContextMenu={e => e.preventDefault()}
        />

        {/* Modal Gestione Scena / Pin al click */}
        {showPinModal && selectedPin && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-veil-gold/30 bg-[#0c1018] p-6 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedPin.icon}</span>
                  <h3 className="font-bold text-lg text-veil-gold">{selectedPin.name}</h3>
                </div>
                <button onClick={() => setShowPinModal(false)} className="text-white/40 hover:text-white">✕</button>
              </div>
              <p className="text-sm text-white/70 mb-4">{selectedPin.description}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMapMode("battlegrid");
                    setShowPinModal(false);
                  }}
                  className="rounded-xl bg-red-500/20 border border-red-500/40 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/30 transition text-center"
                >
                  ⚔️ Avvia Combattimento in questa Scena
                </button>
                <button
                  onClick={() => {
                    setMapMode("location");
                    setShowPinModal(false);
                  }}
                  className="rounded-xl bg-veil-gold/15 border border-veil-gold/30 py-2.5 text-xs font-semibold text-veil-gold hover:bg-veil-gold/25 transition text-center"
                >
                  🏛️ Apri Mappa / Stanza di questa Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
