"use client";
import { useEffect, useRef, useMemo } from "react";

type Cloud = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  opacity: number;
  blur: number;
};

type Props = {
  parallaxOffset?: { x: number; y: number };
};

export function CloudLayer({ parallaxOffset }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const clouds = useRef<Cloud[]>([]);
  const time = useRef(0);

  const initialClouds = useMemo(() => {
    const count = 12;
    return Array.from({ length: count }, (_, i) => ({
      x: -10 + (i / count) * 120,
      y: 5 + Math.random() * 75,
      w: 100 + Math.random() * 200,
      h: 25 + Math.random() * 45,
      speed: 0.03 + Math.random() * 0.12,
      opacity: 0.03 + Math.random() * 0.07,
      blur: 15 + Math.random() * 35,
    }));
  }, []);

  clouds.current = initialClouds;

  useEffect(() => {
    let raf: number;
    const tick = () => {
      time.current += 1;
      if (ref.current) {
        const divs = ref.current.children;
        const px = parallaxOffset?.x ?? 0;
        const py = parallaxOffset?.y ?? 0;
        for (let i = 0; i < clouds.current.length && i < divs.length; i++) {
          const c = clouds.current[i];
          // Move right, loop around
          c.x += c.speed;
          if (c.x > 120) c.x = -20;
          const el = divs[i] as HTMLElement;
          // Parallax: clouds drift with camera, slower
          el.style.transform = `translate(${c.x - px * 0.008}vw, ${c.y - py * 0.008}vh)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [parallaxOffset]);

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {initialClouds.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: `${c.w}px`,
            height: `${c.h}px`,
            opacity: c.opacity,
            filter: `blur(${c.blur}px)`,
            transform: `translate(${c.x}vw, ${c.y}vh)`,
            transition: "none",
          }}
        />
      ))}
    </div>
  );
}
