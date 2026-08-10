import { useEffect, useRef } from "react";

/**
 * Organic, living audio orb. Wobbling teal membrane with inner rings and a
 * speckled core. Amplitude reacts to playback state and level.
 */
export function VoiceOrb({
  active,
  level = 0,
  onToggle,
  playing,
}: {
  active: boolean;
  level?: number;
  onToggle?: () => void;
  playing?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const levelRef = useRef(level);
  activeRef.current = active;
  levelRef.current = level;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let energy = 0;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const speckles = Array.from({ length: 46 }, (_, i) => ({
      a: (i / 46) * Math.PI * 2 + Math.random(),
      r: Math.sqrt(Math.random()),
      s: 0.6 + Math.random() * 1.2,
      p: Math.random() * Math.PI * 2,
    }));

    const blob = (
      cx: number,
      cy: number,
      radius: number,
      wobble: number,
      t: number,
      seed: number,
      width: number,
      alpha: number,
    ) => {
      const steps = 180;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const n =
          Math.sin(a * 5 + t * 0.9 + seed) * 0.55 +
          Math.sin(a * 8 - t * 1.3 + seed * 2) * 0.3 +
          Math.sin(a * 3 + t * 0.5 + seed * 3) * 0.4;
        const r = radius * (1 + n * wobble);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.98;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(126, 240, 227, ${alpha})`;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h) * 0.36;

      const target = activeRef.current ? 0.55 + levelRef.current * 0.9 : 0.16;
      energy += (target - energy) * 0.06;

      ctx.clearRect(0, 0, w, h);

      // ambient glow
      const glow = ctx.createRadialGradient(cx, cy, base * 0.1, cx, cy, base * 1.9);
      glow.addColorStop(0, `rgba(56, 200, 190, ${0.16 + energy * 0.18})`);
      glow.addColorStop(0.55, "rgba(30, 120, 125, 0.08)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // membrane fill
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // outer membrane (thick, bright)
      ctx.shadowBlur = 24 + energy * 40;
      ctx.shadowColor = "rgba(120, 240, 226, 0.65)";
      blob(cx, cy, base * 1.08, 0.035 + energy * 0.05, t, 0, 2.4, 0.85);
      ctx.shadowBlur = 0;

      // inner rings
      blob(cx, cy, base * 0.9, 0.03 + energy * 0.04, t * 1.1, 1.7, 1.1, 0.4);
      blob(cx, cy, base * 0.68, 0.045 + energy * 0.07, t * 1.3, 3.1, 1, 0.3);
      blob(cx, cy, base * 0.5, 0.05 + energy * 0.09, t * 1.6, 5.2, 1, 0.26);

      // core disc
      const coreR = base * (0.24 + energy * 0.05);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.6);
      core.addColorStop(0, `rgba(150, 255, 240, ${0.22 + energy * 0.3})`);
      core.addColorStop(1, "rgba(20, 90, 95, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 1.6, 0, Math.PI * 2);
      ctx.fill();

      blob(cx, cy, coreR, 0.05 + energy * 0.06, t * 2, 8.4, 1.2, 0.55);

      // speckles inside the core
      for (const s of speckles) {
        const wob = Math.sin(t * (0.8 + s.s) + s.p) * 0.12;
        const rr = coreR * (s.r * 0.92 + wob * 0.2);
        const x = cx + Math.cos(s.a + t * 0.12) * rr;
        const y = cy + Math.sin(s.a + t * 0.12) * rr;
        ctx.beginPath();
        ctx.arc(x, y, s.s * (0.7 + energy * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 255, 245, ${0.25 + energy * 0.45})`;
        ctx.fill();
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? "Pause summary" : "Play summary"}
      className="group relative block aspect-square w-full max-w-[22rem] cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-viz/60"
    >
      <canvas ref={ref} className="size-full" />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="translate-y-0 text-[10px] font-semibold uppercase tracking-[0.32em] text-viz/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {playing ? "Pause" : "Play"}
        </span>
      </span>
    </button>
  );
}
