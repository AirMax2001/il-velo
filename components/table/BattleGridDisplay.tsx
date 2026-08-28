"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { subscribeToTable } from "@/lib/supabaseClient";
import { renderCleanMap, type Token, type MapObject } from "@/components/dm/DungeonMapMaker";

const BASE_CELL = 32;

type Props = { sessionId: string };

export function BattleGridDisplay({ sessionId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [gridW, setGridW] = useState(50);
  const [gridH, setGridH] = useState(38);
  const [tiles, setTiles] = useState<Record<string, string>>({});
  const [walls, setWalls] = useState<Record<string, string>>({});
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [pins, setPins] = useState<any[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/battlemap?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.battlemap) {
        setGridW(data.battlemap.grid_width || 50);
        setGridH(data.battlemap.grid_height || 38);
        setTiles(data.battlemap.tiles || {});
        setWalls(data.battlemap.walls || {});
        setObjects(data.battlemap.objects || []);
        setPins(data.battlemap.pins || []);
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

  // Render automatico su canvas ad ogni cambiamento di stato, ridimensionamento o zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || loading) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Adatta il canvas alle dimensioni della finestra di visualizzazione (iPad / Schermo tavolo)
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Calcola il fattore di zoom per fittare la griglia nello schermo intero mantenendo l'aspect ratio
    const scaleX = canvas.width / (gridW * BASE_CELL);
    const scaleY = canvas.height / (gridH * BASE_CELL);
    const scale = Math.min(scaleX, scaleY, 1.8);
    const cellSize = BASE_CELL * scale;

    // Centra la mappa orizzontalmente e verticalmente nel canvas
    const mapW = gridW * cellSize;
    const mapH = gridH * cellSize;
    const panX = (canvas.width - mapW) / 2;
    const panY = (canvas.height - mapH) / 2;

    renderCleanMap(
      ctx,
      "location",
      tiles,
      walls,
      objects,
      pins,
      tokens,
      gridW,
      gridH,
      cellSize,
      panX,
      panY,
      canvas.width,
      canvas.height,
      true
    );
  }, [tiles, walls, objects, pins, tokens, gridW, gridH, loading]);

  // Ascoltatore del ridimensionamento finestra per aggiornare la visualizzazione
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        // Trigger a force render
        setLoading(l => !l);
        setLoading(false);
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-white/30 font-mono">
        Caricamento Mappa Tattica…
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full bg-[#030608] overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
