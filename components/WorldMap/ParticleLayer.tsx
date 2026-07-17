"use client";
import { useEffect, useRef, useMemo } from "react";

type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number;
};

export function ParticleLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const time = useRef(0);

  const seed = useMemo(() => {
    const count = 30;
    return Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 2.5,
      speedX: -0.02 + Math.random() * 0.04,
      speedY: -0.01 + Math.random() * 0.03,
      opacity: 0.15 + Math.random() * 0.35,
      hue: 30 + Math.random() * 60, // warm gold/dust tones
    }));
  }, []);

  particles.current = seed;

  useEffect(() => {
    let raf: number;
    const tick = () => {
      time.current += 0.016;
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(tick); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(tick); return; }

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles.current) {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x > 105) p.x = -5;
        if (p.x < -5) p.x = 105;
        if (p.y > 105) p.y = -5;
        if (p.y < -5) p.y = 105;

        const screenX = (p.x / 100) * canvas.width;
        const screenY = (p.y / 100) * canvas.height;
        const flicker = 0.6 + Math.sin(time.current * 2 + p.x * 10) * 0.4;

        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.opacity * flicker})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[6]"
    />
  );
}
