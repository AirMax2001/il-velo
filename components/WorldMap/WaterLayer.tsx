"use client";
import { useEffect, useRef } from "react";

export function WaterLayer() {
  const ref = useRef<HTMLDivElement>(null);
  const time = useRef(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      time.current += 0.02;
      if (ref.current) {
        const s = Math.sin(time.current) * 0.5 + 0.5;
        ref.current.style.opacity = String(0.02 + s * 0.03);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 pointer-events-none z-[5]"
      style={{
        background: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 40px,
          rgba(100, 200, 255, 0.02) 40px,
          rgba(100, 200, 255, 0.02) 80px
        )`,
        mixBlendMode: "overlay",
      }}
    />
  );
}
