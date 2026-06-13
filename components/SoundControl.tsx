'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './SoundControl.module.css';

type Props = {
  on: boolean;
  vol: number;
  onToggle: () => void;
  onVol: (v: number) => void;
};

export default function SoundControl({ on, vol, onToggle, onVol }: Props) {
  const [expanded, setExpanded] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const open = () => {
    if (collapseTimer.current) { clearTimeout(collapseTimer.current); collapseTimer.current = null; }
    setExpanded(true);
  };
  const scheduleClose = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setExpanded(false), 600);
  };

  useEffect(() => {
    if (!expanded) return;
    const onDoc = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setExpanded(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [expanded]);

  const pct = vol + '%';

  return (
    <div
      ref={rootRef}
      className={`${styles.snd} kb-snd ${on ? styles.sndOn : styles.sndOff}`}
      data-on={on ? '1' : '0'}
      data-expanded={expanded ? '1' : '0'}
      style={{ '--pct': pct } as React.CSSProperties}
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
    >
      <div className={`${styles.tray} ${expanded ? styles.trayOpen : ''}`}>
        <input
          type="range"
          className={styles.range}
          min="0"
          max="100"
          value={vol}
          onChange={e => onVol(parseInt(e.target.value))}
          aria-label="Громкость фонового звука"
        />
      </div>

      <button
        className={`${styles.orb} ${on ? styles.orbInk : styles.orbInkOff}`}
        onClick={onToggle}
        aria-label={on ? 'Выключить звук' : 'Включить звук'}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9 L4 15 L8 15 L13 19 L13 5 L8 9 Z" />
          <g className={styles.waves}>
            <path d="M16.5 9 Q 18.6 12 16.5 15" />
            <path d="M19 6.8 Q 22.4 12 19 17.2" />
          </g>
          <line className={styles.slash} x1="3" y1="3.2" x2="21" y2="20.8" />
        </svg>
      </button>
    </div>
  );
}
