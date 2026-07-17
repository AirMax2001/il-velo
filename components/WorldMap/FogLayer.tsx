"use client";
import { useMemo, useEffect, useRef } from "react";
import { MapLocation } from "@/types/map";

type Props = {
  locations: MapLocation[];
  discovered: Set<string>;
  imageW: number;
  imageH: number;
  parallaxOffset?: { x: number; y: number };
};

export function FogLayer({ locations, discovered, imageW, imageH, parallaxOffset }: Props) {
  const ref = useRef<SVGRectElement>(null);
  const timeRef = useRef(0);

  // Undiscovered locations → fog holes
  const fogHoles = useMemo(() => {
    return locations
      .filter((l) => !discovered.has(l.id) && l.unlocked)
      .map((l) => {
        const cx =
          l.polygon.reduce((s, p) => s + p[0], 0) / l.polygon.length;
        const cy =
          l.polygon.reduce((s, p) => s + p[1], 0) / l.polygon.length;
        const r = 120;
        return { cx, cy, r };
      });
  }, [locations, discovered]);

  // Build SVG mask path for fog cutouts
  const mask = useMemo(() => {
    if (fogHoles.length === 0) return null;
    let d = `M 0 0 L ${imageW} 0 L ${imageW} ${imageH} L 0 ${imageH} Z`;
    for (const hole of fogHoles) {
      d += ` M ${hole.cx} ${hole.cy - hole.r} A ${hole.r} ${hole.r} 0 1 0 ${hole.cx} ${hole.cy + hole.r} A ${hole.r} ${hole.r} 0 1 0 ${hole.cx} ${hole.cy - hole.r} Z`;
    }
    return d;
  }, [fogHoles, imageW, imageH]);

  // Animate fog opacity drift
  useEffect(() => {
    let raf: number;
    const tick = () => {
      timeRef.current += 0.005;
      if (ref.current) {
        const drift = Math.sin(timeRef.current * 0.3) * 0.02 + 0.12;
        ref.current.setAttribute("opacity", String(drift));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!mask) return null;

  const px = parallaxOffset?.x ?? 0;
  const py = parallaxOffset?.y ?? 0;

  return (
    <g>
      <defs>
        <mask id="fogMask">
          <rect x="0" y="0" width={imageW} height={imageH} fill="black" />
          <path d={mask} fill="white" />
        </mask>
      </defs>
      <rect
        ref={ref}
        x={-px * 0.02}
        y={-py * 0.02}
        width={imageW + Math.abs(px) * 0.04}
        height={imageH + Math.abs(py) * 0.04}
        fill="#0a0a12"
        opacity="0.12"
        mask="url(#fogMask)"
        style={{ transition: "opacity 0.8s ease" }}
      />
    </g>
  );
}
