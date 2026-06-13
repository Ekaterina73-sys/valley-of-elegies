'use client';

import { useRef, useCallback, useEffect } from 'react';
import styles from './CardFrame.module.css';

// SVG path geometry for concave-corner card shape
const CF_W = 300, CF_H = 400;
const CF_R_OUT = 24;
const CF_INSET = 14;
const CF_R_IN = 18;

function cfOuterPath(): string {
  const R = CF_R_OUT, W = CF_W, H = CF_H;
  return [
    `M ${R} 0`,
    `L ${W - R} 0`,
    `A ${R} ${R} 0 0 0 ${W} ${R}`,
    `L ${W} ${H - R}`,
    `A ${R} ${R} 0 0 0 ${W - R} ${H}`,
    `L ${R} ${H}`,
    `A ${R} ${R} 0 0 0 0 ${H - R}`,
    `L 0 ${R}`,
    `A ${R} ${R} 0 0 0 ${R} 0`,
    'Z',
  ].join(' ');
}

function cfInnerPath(): string {
  const R = CF_R_IN, W = CF_W, H = CF_H, D = CF_INSET;
  return [
    `M ${D + R} ${D}`,
    `L ${W - D - R} ${D}`,
    `A ${R} ${R} 0 0 0 ${W - D} ${D + R}`,
    `L ${W - D} ${H - D - R}`,
    `A ${R} ${R} 0 0 0 ${W - D - R} ${H - D}`,
    `L ${D + R} ${H - D}`,
    `A ${R} ${R} 0 0 0 ${D} ${H - D - R}`,
    `L ${D} ${D + R}`,
    `A ${R} ${R} 0 0 0 ${D + R} ${D}`,
    'Z',
  ].join(' ');
}

// Inject card mask CSS variable once
let maskInjected = false;
function ensureCardMask() {
  if (maskInjected || typeof document === 'undefined') return;
  maskInjected = true;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${CF_W} ${CF_H}' preserveAspectRatio='none'><path d='${cfOuterPath()}' fill='white'/></svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  document.documentElement.style.setProperty('--kb-card-mask', url);
}

// Tilt hook
export function useTilt(maxDeg = 11) {
  const ref = useRef<HTMLButtonElement>(null);
  const rafRef = useRef(0);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    pendingRef.current = { x, y };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const p = pendingRef.current;
      if (!p || !ref.current) return;
      const ry = (p.x - 0.5) * maxDeg * 2;
      const rx = -(p.y - 0.5) * maxDeg * 2;
      ref.current.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      ref.current.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      ref.current.style.setProperty('--gx', (p.x * 100).toFixed(1) + '%');
      ref.current.style.setProperty('--gy', (p.y * 100).toFixed(1) + '%');
    });
  }, [maxDeg]);

  const onMouseEnter = useCallback(() => {
    ref.current?.classList.add(styles.tilting);
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove(styles.tilting);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, []);

  useEffect(() => {
    ensureCardMask();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { ref, onMouseMove, onMouseEnter, onMouseLeave };
}

// CardFrame component
type CardFrameProps = {
  children: React.ReactNode;
  world?: boolean;
  character?: boolean;
};

export function CardFrame({ children, world = false, character = false }: CardFrameProps) {
  return (
    <div className={`${styles.cardFrame}${world ? ' is-world' : ''}`}>
      <div className={styles.glare} />
      <svg
        className={styles.cardLine}
        viewBox={`0 0 ${CF_W} ${CF_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={cfInnerPath()} />
      </svg>
      <div className={character ? styles.cardInnerChar : styles.cardInner}>
        {children}
      </div>
    </div>
  );
}

export { styles as cardStyles, cfInnerPath, CF_W, CF_H };
