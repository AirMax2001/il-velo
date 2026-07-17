"use client";
import { useRef, useCallback, useEffect } from "react";
import { CameraState, MapConfig } from "@/types/map";
import { clampCamera, springCamera } from "@/lib/mapEngine";

export function useCamera(config: MapConfig, viewW: number, viewH: number) {
  const state = useRef<CameraState>({
    x: config.imageWidth / 2,
    y: config.imageHeight / 2,
    zoom: config.initialZoom,
  });

  // Dynamic min zoom — raised to lock zoom-out past fit
  const minZoomRef = useRef(config.minZoom);
  const setMinZoom = useCallback((nz: number) => { minZoomRef.current = nz; }, []);

  // Velocity for inertia & spring
  const vx = useRef(0);
  const vy = useRef(0);
  const vz = useRef(0);

  // Animation targets
  const target = useRef<CameraState | null>(null);
  const animating = useRef(false);
  const listeners = useRef<Set<(s: CameraState) => void>>(new Set());

  // Track last frame time for smooth delta
  const lastTime = useRef(0);

  const subscribe = useCallback((fn: (s: CameraState) => void) => {
    listeners.current.add(fn);
    return () => { listeners.current.delete(fn); };
  }, []);

  const notify = useCallback(() => {
    listeners.current.forEach((fn) => fn({ ...state.current }));
  }, []);

  const set = useCallback(
    (s: Partial<CameraState>) => {
      state.current = { ...state.current, ...s };
      state.current = clampCamera(state.current, config, viewW, viewH);
      state.current = { ...state.current, zoom: Math.max(state.current.zoom, minZoomRef.current) };
      notify();
    },
    [config, viewW, viewH, notify]
  );

  const moveBy = useCallback(
    (dx: number, dy: number) => {
      vx.current = -dx / state.current.zoom;
      vy.current = -dy / state.current.zoom;
      state.current = {
        ...state.current,
        x: state.current.x + vx.current,
        y: state.current.y + vy.current,
      };
      state.current = clampCamera(state.current, config, viewW, viewH);
      notify();
    },
    [config, viewW, viewH, notify]
  );

  const zoomBy = useCallback(
    (delta: number, cx: number, cy: number) => {
      let nz = clampCamera(
        { ...state.current, zoom: state.current.zoom * (1 + delta) },
        config,
        viewW,
        viewH
      ).zoom;
      nz = Math.max(nz, minZoomRef.current);
      const ratio = nz / state.current.zoom;
      state.current = {
        x: cx + (state.current.x - cx) * ratio,
        y: cy + (state.current.y - cy) * ratio,
        zoom: nz,
      };
      state.current = clampCamera(state.current, config, viewW, viewH);
      state.current = { ...state.current, zoom: Math.max(state.current.zoom, minZoomRef.current) };
      notify();
    },
    [set, config, viewW, viewH]
  );

  const animateTo = useCallback(
    (targetState: Partial<CameraState>) => {
      const to = { ...state.current, ...targetState };
      target.current = to;
      animating.current = true;
      lastTime.current = performance.now();
    },
    []
  );

  // Inertia decay
  const applyInertia = useCallback(() => {
    if (animating.current) return;
    const speed = Math.sqrt(vx.current * vx.current + vy.current * vy.current);
    if (speed < 0.001) return;
    vx.current *= 0.85;
    vy.current *= 0.85;
    state.current = {
      ...state.current,
      x: state.current.x + vx.current,
      y: state.current.y + vy.current,
    };
    state.current = clampCamera(state.current, config, viewW, viewH);
    notify();
  }, [config, viewW, viewH, notify]);

  // Animation loop
  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (animating.current && target.current) {
        const [next, nvx, nvy, nvz] = springCamera(
          state.current,
          target.current,
          vx.current,
          vy.current,
          vz.current
        );
        vx.current = nvx;
        vy.current = nvy;
        vz.current = nvz;
        state.current = clampCamera(next, config, viewW, viewH);
        notify();

        // Check if settled
        const dx = Math.abs(state.current.x - target.current.x);
        const dy = Math.abs(state.current.y - target.current.y);
        const dz = Math.abs(state.current.zoom - target.current.zoom);
        const speed = Math.sqrt(
          vx.current * vx.current +
          vy.current * vy.current +
          vz.current * vz.current
        );
        if (dx < 0.5 && dy < 0.5 && dz < 0.001 && speed < 0.05) {
          animating.current = false;
          target.current = null;
          vx.current = 0;
          vy.current = 0;
          vz.current = 0;
        }
      } else {
        applyInertia();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [config, viewW, viewH, notify, applyInertia]);

  return { state, set, moveBy, zoomBy, animateTo, subscribe, notify, setMinZoom };
}
