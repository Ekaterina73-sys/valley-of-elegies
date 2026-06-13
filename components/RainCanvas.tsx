'use client';

import { useEffect, useRef, useCallback } from 'react';

// ── Phase timecodes (seconds from kb:rain-start) ──────────────────────────────
function dropIntensity(t: number): number {
  if (t < 10)  return 0;
  if (t < 130) return (t - 10) / 120;
  if (t < 300) return 1;
  if (t < 420) return (420 - t) / 120;
  return 0;
}

// ── Geometry: drops only on sash glass, never in the center gap ───────────────
// Left sash glass:  2%–46% of canvas width
// Right sash glass: 54%–98% of canvas width
function sashX(W: number): number {
  return Math.random() < 0.5
    ? W * (0.02 + Math.random() * 0.44)
    : W * (0.54 + Math.random() * 0.44);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Drop {
  x: number; y: number; r: number;
  vY: number; trailLen: number; alpha: number; done: boolean;
}

// Condensation blobs — small, static, fade in/out, never fall
interface Blob {
  x: number; y: number; r: number;
  alpha: number; age: number; maxAge: number; done: boolean;
}

// ── Spawn ─────────────────────────────────────────────────────────────────────

function spawnDrop(W: number, H: number, fallThres: number): Drop {
  // Always start below fallThres so there's a visible "stuck" phase
  const maxStart = Math.min(1.4, fallThres * 0.60);
  return {
    x:        sashX(W),
    y:        H * (0.02 + Math.random() * 0.26),
    r:        0.5 + Math.random() * maxStart,
    vY:       0,
    trailLen: 0,
    alpha:    0,
    done:     false,
  };
}

function spawnBlob(W: number, H: number): Blob {
  return {
    x:      sashX(W),
    y:      H * (0.01 + Math.random() * 0.38),
    r:      0.4 + Math.random() * 1.1,
    alpha:  0,
    age:    0,
    maxAge: 4000 + Math.random() * 9000,
    done:   false,
  };
}

// ── Draw ──────────────────────────────────────────────────────────────────────

function drawDrop(ctx: CanvasRenderingContext2D, d: Drop) {
  const falling = d.vY > 0;
  const rX = falling ? d.r * 0.52 : d.r * 0.88;
  const rY = falling ? d.r * 1.45 : d.r;

  ctx.save();
  ctx.globalAlpha = d.alpha * 0.94;

  // Trail — wider than before
  if (falling && d.trailLen > 2) {
    const tw = Math.max(rX * 1.15, 1.8);
    const tg = ctx.createLinearGradient(d.x, d.y - d.trailLen, d.x, d.y);
    tg.addColorStop(0,    'rgba(175,210,255,0)');
    tg.addColorStop(0.35, 'rgba(185,218,255,0.30)');
    tg.addColorStop(1,    'rgba(205,228,255,0.58)');
    ctx.beginPath();
    ctx.moveTo(d.x - tw * 0.42, d.y - d.trailLen);
    ctx.lineTo(d.x + tw * 0.42, d.y - d.trailLen);
    ctx.lineTo(d.x + tw * 0.65, d.y - rY * 0.4);
    ctx.lineTo(d.x - tw * 0.65, d.y - rY * 0.4);
    ctx.closePath();
    ctx.fillStyle = tg;
    ctx.fill();
  }

  // Drop body
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

  // Specular highlight
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

function drawBlob(ctx: CanvasRenderingContext2D, b: Blob) {
  ctx.save();
  ctx.globalAlpha = b.alpha * 0.80;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(
    b.x - b.r * 0.28, b.y - b.r * 0.28, 0,
    b.x, b.y, b.r
  );
  g.addColorStop(0,    'rgba(210, 235, 255, 0.30)');
  g.addColorStop(0.55, 'rgba(185, 218, 255, 0.18)');
  g.addColorStop(1,    'rgba(255, 255, 255, 0.82)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GROW_RATE = 0.0035;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { elapsedSec: number; startKey: number }

export default function RainCanvas({ elapsedSec, startKey }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const dropsRef     = useRef<Drop[]>([]);
  const blobsRef     = useRef<Blob[]>([]);
  const rafRef       = useRef(0);
  const lastTRef     = useRef(0);
  const nextSpawnRef = useRef(0);
  const nextBlobRef  = useRef(0);
  const elapsedRef   = useRef(elapsedSec);
  elapsedRef.current = elapsedSec;

  const animate = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = 0; return; }
    const ctx = canvas.getContext('2d');
    if (!ctx)   { rafRef.current = 0; return; }

    const dt = Math.min(ts - lastTRef.current, 50);
    lastTRef.current = ts;

    const t         = elapsedRef.current;
    const intensity = t >= 0 ? dropIntensity(t) : 0;
    const W = canvas.width;
    const H = canvas.height;

    const fallThres  = 3.5 - intensity * 1.5;
    const dynFallMax = 0.08 + intensity * 0.20;
    const dynAccel   = 0.00022 + intensity * 0.00028;

    const maxDrops = Math.round(4 + intensity * 24);
    const spawnMs  = 280 + (1 - intensity) * 3220;

    const maxBlobs = Math.round(intensity * 40);
    const blobMs   = 350 + (1 - intensity) * 2800;

    if (ts >= nextSpawnRef.current && dropsRef.current.length < maxDrops && intensity > 0) {
      dropsRef.current.push(spawnDrop(W, H, fallThres));
      nextSpawnRef.current = ts + spawnMs * (0.65 + Math.random() * 0.70);
    }

    if (ts >= nextBlobRef.current && blobsRef.current.length < maxBlobs && intensity > 0) {
      blobsRef.current.push(spawnBlob(W, H));
      nextBlobRef.current = ts + blobMs * (0.5 + Math.random() * 1.0);
    }

    ctx.clearRect(0, 0, W, H);

    // Blobs drawn first (behind drops)
    blobsRef.current = blobsRef.current.filter(b => {
      b.age += dt;
      const fadeIn  = b.maxAge * 0.15;
      const fadeOut = b.maxAge * 0.25;
      if (b.age < fadeIn) {
        b.alpha = b.age / fadeIn;
      } else if (b.age > b.maxAge - fadeOut) {
        b.alpha = Math.max(0, (b.maxAge - b.age) / fadeOut);
      } else {
        b.alpha = 1;
      }
      if (b.age >= b.maxAge) b.done = true;
      if (!b.done) drawBlob(ctx, b);
      return !b.done;
    });

    // Sliding drops on top
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

    if (elapsedRef.current >= 0 || intensity > 0 || dropsRef.current.length > 0 || blobsRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      rafRef.current = 0;
    }
  }, []);

  const active = elapsedSec >= 0;

  useEffect(() => {
    if (active) {
      dropsRef.current     = [];
      blobsRef.current     = [];
      nextSpawnRef.current = performance.now();
      nextBlobRef.current  = performance.now();
      lastTRef.current     = performance.now();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current   = 0;
      dropsRef.current = [];
      blobsRef.current = [];
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
