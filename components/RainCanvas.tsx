'use client';

import { useEffect, useRef, useCallback } from 'react';

// ── Phase timecodes (seconds from kb:rain-start) ─────────────────────────────
// 0–10s     → no drops (light cooling / blur handled by Window.tsx)
// 10–130s   → drops ramp 0→1 (2 min)
// 130–300s  → peak (intensity = 1)
// 300–420s  → drops fade 1→0 (2 min)
// 420s+     → done

function dropIntensity(t: number): number {
  if (t < 10)  return 0;
  if (t < 130) return (t - 10) / 120;
  if (t < 300) return 1;
  if (t < 420) return (420 - t) / 120;
  return 0;
}

// ── Drop ──────────────────────────────────────────────────────────────────────

interface Drop {
  x: number;
  y: number;
  r: number;
  vY: number;       // fall speed px/ms (0 = accumulating)
  trailLen: number;
  alpha: number;
  done: boolean;
}

function spawnDrop(W: number, H: number, intensity: number): Drop {
  // Smaller drops; slightly bigger at peak so they're still visible
  const maxR = 1.5 + intensity * 2.5;   // 1.5px at start → 4px at peak
  return {
    x:        W * (0.05 + Math.random() * 0.90),
    y:        H * (0.02 + Math.random() * 0.26),
    r:        1.0 + Math.random() * (maxR - 1.0),
    vY:       0,
    trailLen: 0,
    alpha:    0,
    done:     false,
  };
}

function drawDrop(ctx: CanvasRenderingContext2D, d: Drop) {
  const falling = d.vY > 0;
  const rX = falling ? d.r * 0.52 : d.r * 0.88;
  const rY = falling ? d.r * 1.45 : d.r;

  ctx.save();
  ctx.globalAlpha = d.alpha * 0.94;

  // Wet trail (only when long enough and drop has a visible size)
  if (falling && d.trailLen > 2) {
    const tw = Math.max(rX * 0.7, 0.8);
    const tg = ctx.createLinearGradient(d.x, d.y - d.trailLen, d.x, d.y);
    tg.addColorStop(0,    'rgba(175,210,255,0)');
    tg.addColorStop(0.35, 'rgba(185,218,255,0.26)');
    tg.addColorStop(1,    'rgba(205,228,255,0.50)');
    ctx.beginPath();
    ctx.moveTo(d.x - tw * 0.42, d.y - d.trailLen);
    ctx.lineTo(d.x + tw * 0.42, d.y - d.trailLen);
    ctx.lineTo(d.x + tw * 0.60, d.y - rY * 0.4);
    ctx.lineTo(d.x - tw * 0.60, d.y - rY * 0.4);
    ctx.closePath();
    ctx.fillStyle = tg;
    ctx.fill();
  }

  // Drop body — translucent center with bright glass rim
  ctx.beginPath();
  ctx.ellipse(d.x, d.y, rX, rY, 0, 0, Math.PI * 2);
  const bg = ctx.createRadialGradient(
    d.x, d.y + rY * 0.12, rY * 0.06,
    d.x, d.y, Math.max(rX, rY) * 1.05
  );
  bg.addColorStop(0,    'rgba(30, 55, 100, 0.26)');
  bg.addColorStop(0.42, 'rgba(45, 78, 130, 0.10)');
  bg.addColorStop(0.72, 'rgba(185, 218, 255, 0.28)');
  bg.addColorStop(0.88, 'rgba(235, 248, 255, 0.72)');
  bg.addColorStop(1,    'rgba(255, 255, 255, 0.90)');
  ctx.fillStyle = bg;
  ctx.fill();

  // Specular highlight — minimum size so small drops stay visible
  const hx     = d.x - rX * 0.28;
  const hy     = d.y - rY * 0.36;
  const specRX = Math.max(rX * 0.42, 0.9);
  const specRY = Math.max(rY * 0.28, 0.7);
  const sg     = ctx.createRadialGradient(hx, hy, 0, hx, hy, specRX * 1.4);
  sg.addColorStop(0,    'rgba(255,255,255,0.95)');
  sg.addColorStop(0.42, 'rgba(255,255,255,0.42)');
  sg.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.ellipse(hx, hy, specRX, specRY, 0, 0, Math.PI * 2);
  ctx.fillStyle = sg;
  ctx.fill();

  ctx.restore();
}

// ── Static constants ──────────────────────────────────────────────────────────

const GROW_RATE = 0.0035; // r/ms while accumulating

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { elapsedSec: number; startKey: number }

export default function RainCanvas({ elapsedSec, startKey }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const dropsRef     = useRef<Drop[]>([]);
  const rafRef       = useRef(0);
  const lastTRef     = useRef(0);
  const nextSpawnRef = useRef(0);
  const elapsedRef   = useRef(elapsedSec);
  elapsedRef.current = elapsedSec;

  const animate = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = 0; return; }
    const ctx = canvas.getContext('2d');
    if (!ctx)   { rafRef.current = 0; return; }

    const dt         = Math.min(ts - lastTRef.current, 50);
    lastTRef.current = ts;

    const t         = elapsedRef.current;
    const intensity = t >= 0 ? dropIntensity(t) : 0;
    const W = canvas.width;
    const H = canvas.height;

    // Intensity-driven physics — faster and more drops near peak
    const fallThres  = 3.5 - intensity * 1.5;          // 3.5px → 2.0px at peak
    const dynFallMax = 0.08 + intensity * 0.20;         // 0.08 → 0.28 px/ms
    const dynAccel   = 0.00022 + intensity * 0.00028;   // faster accel at peak

    // More drops and faster spawn as intensity rises
    const maxDrops = Math.round(4 + intensity * 24);    // 4 → 28
    const spawnMs  = 280 + (1 - intensity) * 3220;      // 280ms → 3.5s
    if (ts >= nextSpawnRef.current && dropsRef.current.length < maxDrops && intensity > 0) {
      dropsRef.current.push(spawnDrop(W, H, intensity));
      nextSpawnRef.current = ts + spawnMs * (0.65 + Math.random() * 0.70);
    }

    ctx.clearRect(0, 0, W, H);

    dropsRef.current = dropsRef.current.filter(d => {
      d.alpha = Math.min(1, d.alpha + dt * 0.0032);

      if (d.vY === 0) {
        d.r += GROW_RATE * dt;
        if (d.r >= fallThres) d.vY = 0.04;
      } else {
        d.vY      = Math.min(d.vY + dynAccel * dt, dynFallMax);
        d.y      += d.vY * dt;
        d.trailLen = Math.min(d.trailLen + d.vY * dt * 2.0, H * 0.40);
      }

      if (intensity < 0.04 && d.vY > 0) d.alpha -= dt * 0.0012;
      if (d.y - d.r > H || d.alpha <= 0) d.done = true;
      return !d.done;
    });

    dropsRef.current.forEach(d => drawDrop(ctx, d));

    // Keep loop alive while rain is scheduled (t≥0) or drops are still draining
    if (elapsedRef.current >= 0 || intensity > 0 || dropsRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      rafRef.current = 0;
    }
  }, []);

  const active = elapsedSec >= 0;

  // startKey increments on every new rain session — forces the effect to
  // restart the RAF loop even when active was already true (re-triggered rain)
  useEffect(() => {
    if (active) {
      dropsRef.current     = [];
      nextSpawnRef.current = performance.now();
      lastTRef.current     = performance.now();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current   = 0;
      dropsRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey, active, animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      const p = canvas.parentElement;
      if (p) { canvas.width = p.offsetWidth; canvas.height = p.offsetHeight; }
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'absolute',
        inset:         0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        5,
        mixBlendMode:  'normal',
      }}
    />
  );
}
