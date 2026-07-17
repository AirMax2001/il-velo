"use client";
import { useState, useCallback, useMemo } from "react";
import { MapLocation } from "@/types/map";
import { polygonCenter, findLocationAt } from "@/lib/mapEngine";

export function useMap(initialLocations: MapLocation[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(
    new Set(initialLocations.filter((l) => l.discovered).map((l) => l.id))
  );
  const [showFog, setShowFog] = useState(true);

  const locations = useMemo(() => initialLocations, [initialLocations]);

  const selected = useMemo(
    () => locations.find((l) => l.id === selectedId) ?? null,
    [locations, selectedId]
  );

  const hovered = useMemo(
    () => locations.find((l) => l.id === hoveredId) ?? null,
    [locations, hoveredId]
  );

  const discover = useCallback((id: string) => {
    setDiscovered((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id) discover(id);
    },
    [discover]
  );

  const selectAtPoint = useCallback(
    (ix: number, iy: number) => {
      const loc = findLocationAt(ix, iy, locations);
      if (loc) {
        select(loc.id);
        return loc;
      }
      return null;
    },
    [locations, select]
  );

  const getConnectedLocations = useCallback(
    (id: string) => {
      const loc = locations.find((l) => l.id === id);
      if (!loc?.connectedLocations) return [];
      return loc.connectedLocations
        .map((cid) => locations.find((l) => l.id === cid))
        .filter(Boolean) as MapLocation[];
    },
    [locations]
  );

  return {
    locations,
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
  };
}
