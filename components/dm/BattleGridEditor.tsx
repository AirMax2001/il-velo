"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { subscribeToTable } from "@/lib/supabaseClient";

type BattleToken = {
  id: string;
  name: string;
  type: "player" | "enemy" | "prop";
  x: number;
  y: number;
  hp_current?: number;
  hp_max?: number;
  color?: string;
};

type TileType = "void" | "floor" | "wall" | "water" | "door" | "door_open";

type Props = {
  sessionId: string;
};

const CELL_SIZE = 40;

// Griglia di stili visuali per i tipi di tasselli
const TILE_STYLES: Record<TileType, string> = {
  void: "#06070a",
  floor: "repeating-conic-gradient(rgba(255,255,255,0.012) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px, #22262e",
  wall: "repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 2px, transparent 2px, transparent 8px), #4e5564",
  water: "repeating-linear-gradient(-45deg, rgba(30,120,180,0.08) 0px, rgba(30,120,180,0.08) 2px, transparent 2px, transparent 8px), #0e1e2d",
  door: "#8b5a2b",
  door_open: "#1a1c22", // frame vuoto
};

export function BattleGridEditor({ sessionId }: Props) {
  const [loading, setLoading] = useState(true);
  const [gridW, setGridW] = useState(20);
  const [gridH, setGridH] = useState(15);
  
  // Mappa di celle coordinate "x,y" -> TileType
  const [tiles, setTiles] = useState<Record<string, TileType>>({});
  const [tokens, setTokens] = useState<BattleToken[]>([]);

  // Brush settings: 'move' | 'floor' | 'wall' | 'water' | 'door' | 'eraser'
  const [brushMode, setBrushMode] = useState<"move" | TileType>("move");
  const isMouseDown = useRef(false);

  // Entities to add as tokens
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [availableEnemies, setAvailableEnemies] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState("");

  const loadGridData = useCallback(async () => {
    try {
      const res = await fetch(`/api/battlemap?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.battlemap) {
        setGridW(data.battlemap.grid_width || 20);
        setGridH(data.battlemap.grid_height || 15);
        setTiles(data.battlemap.tiles || {});
        setTokens(data.battlemap.tokens || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const loadEntities = useCallback(async () => {
    try {
      const pRes = await fetch(`/api/players?sessionId=${sessionId}`);
      const pData = await pRes.json();
      setAvailablePlayers(pData.players || []);

      const cRes = await fetch(`/api/combat?sessionId=${sessionId}&active=true`);
      const combats = await cRes.json();
      const list = Array.isArray(combats) ? combats : (combats?.items || []);
      const active = list.find((c: any) => c.is_active);
      if (active) {
        const ctRes = await fetch(`/api/combatants?combatId=${active.id}`);
        const ctData = await ctRes.json();
        const combatants = Array.isArray(ctData) ? ctData : (ctData?.items || []);
        setAvailableEnemies(combatants.filter((c: any) => c.type !== "player"));
      } else {
        setAvailableEnemies([]);
      }
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    loadGridData();
    loadEntities();

    const unsub = subscribeToTable("battlemap_state", sessionId, loadGridData);
    return () => unsub();
  }, [sessionId, loadGridData, loadEntities]);

  const saveState = async (updatedFields: Partial<any>) => {
    const payload = {
      sessionId,
      grid_width: gridW,
      grid_height: gridH,
      tiles,
      tokens,
      ...updatedFields,
    };

    try {
      await fetch("/api/battlemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Salvataggio fallito:", err);
    }
  };

  // --- Gestione Disegno Griglia ---
  const applyBrush = (x: number, y: number) => {
    if (brushMode === "move") return;
    const key = `${x},${y}`;
    const nextTiles = { ...tiles };
    if (brushMode === "void" || brushMode === "eraser" as any) {
      delete nextTiles[key];
    } else {
      nextTiles[key] = brushMode as TileType;
    }
    setTiles(nextTiles);
  };

  const handleCellPointerDown = (x: number, y: number) => {
    if (brushMode === "move") {
      // In modalità movimento, se fai clic su una porta, la apri/chiudi!
      const key = `${x},${y}`;
      if (tiles[key] === "door" || tiles[key] === "door_open") {
        const nextTiles = { ...tiles };
        nextTiles[key] = tiles[key] === "door" ? "door_open" : "door";
        setTiles(nextTiles);
        saveState({ tiles: nextTiles });
      }
      return;
    }
    isMouseDown.current = true;
    applyBrush(x, y);
  };

  const handleCellPointerEnter = (x: number, y: number) => {
    if (!isMouseDown.current || brushMode === "move") return;
    applyBrush(x, y);
  };

  const handlePointerUpGlobal = () => {
    if (isMouseDown.current) {
      isMouseDown.current = false;
      saveState({ tiles });
    }
  };

  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUpGlobal);
    return () => window.removeEventListener("pointerup", handlePointerUpGlobal);
  }, [tiles, gridW, gridH, tokens, brushMode]);

  // --- Gestione Drag & Drop Token ---
  const handleDragStart = (e: React.DragEvent, tokenId: string) => {
    e.dataTransfer.setData("text/plain", tokenId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, tx: number, ty: number) => {
    e.preventDefault();
    const tokenId = e.dataTransfer.getData("text/plain");
    const nextTokens = tokens.map((t) => {
      if (t.id === tokenId) {
        return { ...t, x: tx, y: ty };
      }
      return t;
    });
    setTokens(nextTokens);
    saveState({ tokens: nextTokens });
  };

  // --- Aggiunta Token ---
  const handleAddToken = () => {
    if (!selectedEntity) return;

    let tokenName = selectedEntity;
    let tokenType: "player" | "enemy" | "prop" = "prop";
    let hpCur = 10;
    let hpMax = 10;

    const player = availablePlayers.find((p) => p.character_name === selectedEntity);
    if (player) {
      tokenType = "player";
      hpCur = player.hp_current || 20;
      hpMax = player.hp_max || 20;
      tokenName = player.character_name;
    } else {
      const enemy = availableEnemies.find((e) => e.name === selectedEntity);
      if (enemy) {
        tokenType = "enemy";
        hpCur = enemy.hp_current || 20;
        hpMax = enemy.hp_max || 20;
        tokenName = enemy.name;
      }
    }

    let tx = 0;
    let ty = 0;
    let found = false;
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const key = `${x},${y}`;
        const isWall = tiles[key] === "wall";
        const hasToken = tokens.some((t) => t.x === x && t.y === y);
        if (!isWall && !hasToken) {
          tx = x;
          ty = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    const newToken: BattleToken = {
      id: `${tokenType}-${Date.now()}`,
      name: tokenName,
      type: tokenType,
      x: tx,
      y: ty,
      hp_current: hpCur,
      hp_max: hpMax,
      color: tokenType === "player" ? "#2f81f7" : tokenType === "enemy" ? "#ff4444" : "#ffaa00",
    };

    const nextTokens = [...tokens, newToken];
    setTokens(nextTokens);
    saveState({ tokens: nextTokens });
    setSelectedEntity("");
  };

  const handleRemoveToken = (tokenId: string) => {
    const nextTokens = tokens.filter((t) => t.id !== tokenId);
    setTokens(nextTokens);
    saveState({ tokens: nextTokens });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-white/40">
        Inizializzazione Map Editor...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar Editor di Mappe */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-black/20 p-3">
        {/* Strumenti Pennello */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/30">Disegna:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setBrushMode("move")}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                brushMode === "move"
                  ? "bg-veil-gold/15 text-veil-gold border border-veil-gold/30"
                  : "bg-black/30 text-white/50 border border-transparent hover:text-white"
              }`}
            >
              🖐 Muovi / Aziona
            </button>
            <button
              onClick={() => setBrushMode("floor")}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                brushMode === "floor"
                  ? "bg-gray-600 text-white border border-gray-500/50"
                  : "bg-black/30 text-white/50 border border-transparent hover:text-white"
              }`}
            >
              🧱 Pavimento
            </button>
            <button
              onClick={() => setBrushMode("wall")}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                brushMode === "wall"
                  ? "bg-gray-500/10 text-gray-300 border border-gray-600/40"
                  : "bg-black/30 text-white/50 border border-transparent hover:text-white"
              }`}
            >
              🪨 Muro
            </button>
            <button
              onClick={() => setBrushMode("water")}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                brushMode === "water"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                  : "bg-black/30 text-white/50 border border-transparent hover:text-white"
              }`}
            >
              🌊 Acqua
            </button>
            <button
              onClick={() => setBrushMode("door")}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                brushMode === "door"
                  ? "bg-amber-800/15 text-amber-500 border border-amber-800/30"
                  : "bg-black/30 text-white/50 border border-transparent hover:text-white"
              }`}
            >
              🚪 Porta
            </button>
            <button
              onClick={() => setBrushMode("eraser" as any)}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                brushMode === ("eraser" as any)
                  ? "bg-red-500/15 text-red-400 border border-red-500/30"
                  : "bg-black/30 text-white/50 border border-transparent hover:text-white"
              }`}
            >
              🧹 Gomma (Vuoto)
            </button>
          </div>
        </div>

        {/* Azioni globali */}
        <button
          onClick={() => {
            if (window.confirm("Cancellare interamente la mappa e ripartire da zero?")) {
              setTiles({});
              saveState({ tiles: {} });
            }
          }}
          className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1 text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-300"
        >
          Reset Mappa
        </button>
      </div>

      {/* Editor & Sidebar */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Canvas del Dungeon */}
        <div className="flex-1 overflow-auto rounded-xl border border-white/[0.08] bg-[#030406] p-4 shadow-inner">
          <div
            className="relative mx-auto border border-white/5"
            style={{
              width: gridW * CELL_SIZE,
              height: gridH * CELL_SIZE,
              userSelect: "none",
            }}
          >
            {/* Celle Disegnabili */}
            <div className="absolute inset-0 grid" style={{
              gridTemplateColumns: `repeat(${gridW}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${gridH}, ${CELL_SIZE}px)`,
            }}>
              {Array.from({ length: gridH }).map((_, y) =>
                Array.from({ length: gridW }).map((_, x) => {
                  const key = `${x},${y}`;
                  const type = tiles[key] || "void";
                  const style = TILE_STYLES[type];
                  return (
                    <div
                      key={key}
                      onPointerDown={() => handleCellPointerDown(x, y)}
                      onPointerEnter={() => handleCellPointerEnter(x, y)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, x, y)}
                      className={`relative border-[0.5px] border-white/[0.015] transition-all duration-75 ${
                        type === "wall"
                          ? "shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_3px_8px_rgba(0,0,0,0.5)] z-10"
                          : ""
                      }`}
                      style={{
                        background: style,
                      }}
                    >
                      {/* Dettagli per le porte */}
                      {type === "door" && (
                        <div className="absolute inset-x-2 inset-y-1 bg-[#b07d4b] border-2 border-[#5c3c1e] rounded flex items-center justify-center text-[10px] text-black font-bold shadow-md cursor-pointer">
                          🔑
                        </div>
                      )}
                      {type === "door_open" && (
                        <div className="absolute inset-x-0.5 inset-y-0.5 border border-dashed border-[#b07d4b]/40 rounded flex items-center justify-center text-[9px] text-[#b07d4b]/60 cursor-pointer">
                          🔓
                        </div>
                      )}

                      {/* Effetto Grid Line Hover in modalità disegno */}
                      {brushMode !== "move" && (
                        <div className="absolute inset-0 hover:bg-white/[0.03] cursor-crosshair" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Tokens */}
            {tokens.map((token) => (
              <div
                key={token.id}
                draggable={brushMode === "move"}
                onDragStart={(e) => handleDragStart(e, token.id)}
                className="absolute flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow z-20"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  left: token.x * CELL_SIZE,
                  top: token.y * CELL_SIZE,
                }}
              >
                <div
                  className="group relative flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 bg-black/90 font-bold text-white shadow-xl hover:scale-105"
                  style={{ borderColor: token.color || "#c9a44c" }}
                >
                  <span className="text-xs tracking-tighter truncate max-w-full px-1">
                    {token.name.substring(0, 2).toUpperCase()}
                  </span>

                  {token.hp_max && token.hp_max > 0 && (
                    <div className="absolute -bottom-1.5 left-1 right-1 h-1 rounded bg-black/60 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{
                          width: `${Math.min(100, ((token.hp_current || 0) / token.hp_max) * 100)}%`,
                        }}
                      />
                    </div>
                  )}

                  <button
                    onClick={() => handleRemoveToken(token.id)}
                    className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white hover:bg-red-500 group-hover:flex"
                  >
                    ✕
                  </button>

                  <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded bg-black/95 px-2 py-0.5 text-[9px] text-white/90 whitespace-nowrap group-hover:block z-30 shadow-md">
                    {token.name} ({token.hp_current}/{token.hp_max} PF)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full xl:w-64 shrink-0 rounded-xl border border-white/[0.08] bg-black/20 p-4 space-y-4">
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Aggiungi Elementi</h4>
            <div className="flex flex-col gap-2">
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 focus:border-veil-gold/30 focus:outline-none"
              >
                <option value="">Seleziona...</option>
                {availablePlayers.length > 0 && (
                  <optgroup label="Giocatori">
                    {availablePlayers.map((p) => (
                      <option key={p.id} value={p.character_name}>
                        {p.character_name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {availableEnemies.length > 0 && (
                  <optgroup label="Nemici (Combattimento)">
                    {availableEnemies.map((e) => (
                      <option key={e.id} value={e.name}>
                        {e.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Oggetti di scena">
                  <option value="Forziere">Forziere</option>
                  <option value="Altare">Altare</option>
                  <option value="Trappola">Trappola</option>
                </optgroup>
              </select>
              <button
                onClick={handleAddToken}
                disabled={!selectedEntity}
                className="w-full rounded-xl border border-veil-gold/20 bg-veil-gold/10 py-2 text-xs font-semibold text-veil-gold hover:bg-veil-gold/20 disabled:opacity-40 disabled:hover:bg-veil-gold/10 transition-all"
              >
                + Posiziona Token
              </button>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-3 text-[10px] text-white/30 leading-relaxed space-y-2">
            <p className="font-bold text-white/40 uppercase tracking-wider">Comandi Rapidi:</p>
            <p>• **Disegna:** Seleziona un tipo di cella (Pavimento, Muro, Acqua, Porta) e trascina il mouse sulla griglia.</p>
            <p>• **Gomma:** Cancella le celle riportandole al nero (il vuoto narrativo).</p>
            <p>• **Muovi / Aziona:** Usa questo strumento per spostare i token col drag-and-drop. **Fai clic su una Porta per aprirla o chiuderla!**</p>
          </div>
        </div>
      </div>
    </div>
  );
}
