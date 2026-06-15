'use client';

import { useRef, useState, useEffect } from 'react';
import { usePlayer } from './PlayerStore';
import { fmtSec } from '@/lib/utils';
import styles from './StickyPlayer.module.css';

export default function StickyPlayer() {
  const { state: st, toggle, next, prev, seekFrac, setVolume, close } = usePlayer();
  const tr = st.track;
  const gold = tr?.accent === 'gold';
  const [drag, setDrag] = useState<number | null>(null);
  const draggingRef = useRef(false);
  const [volOpen, setVolOpen] = useState(false);
  const scrubRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);

  const total = tr ? tr.totalSec : 0;
  const progress = drag != null ? drag : (total ? st.t / total : 0);

  useEffect(() => {
    document.body.classList.toggle('kb-has-player', !!tr);
    return () => document.body.classList.remove('kb-has-player');
  }, [tr]);

  useEffect(() => {
    if (!volOpen) return;
    const onDoc = (e: PointerEvent) => {
      if (volRef.current && !volRef.current.contains(e.target as Node)) setVolOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [volOpen]);

  const fracFromEvent = (e: React.PointerEvent) => {
    const el = scrubRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  const onScrubDown = (e: React.PointerEvent) => {
    if (!tr) return;
    e.preventDefault();
    draggingRef.current = true;
    setDrag(fracFromEvent(e));
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onScrubMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    setDrag(fracFromEvent(e));
  };
  const onScrubUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    seekFrac(fracFromEvent(e));
    setDrag(null);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  return (
    <div
      className={`${styles.player} ${gold ? styles.playerGold : ''}`}
      data-show={tr ? '1' : '0'}
      data-playing={st.playing ? '1' : '0'}
      role="region"
      aria-label="Плеер"
    >
      <div className={styles.lead}>
        <button className={`${styles.btn} ${styles.stepBtn}`} aria-label="Предыдущий" onClick={prev}>
          <svg width="15" height="15" viewBox="0 0 16 16">
            <path d="M5 3 v10 M13 3 L6 8 L13 13 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className={`${styles.btn} ${styles.playBtn} ${gold ? styles.playBtnGold : ''}`}
          aria-label={st.playing ? 'Пауза' : 'Играть'}
          onClick={toggle}
        >
          {st.playing ? (
            <svg width="16" height="16" viewBox="0 0 12 12">
              <rect x="2" y="1.5" width="2.6" height="9" rx="0.6" fill="currentColor"/>
              <rect x="7.4" y="1.5" width="2.6" height="9" rx="0.6" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 12 12" style={{ marginLeft: 2 }}>
              <path d="M2.5 1.5 L10.5 6 L2.5 10.5 Z" fill="currentColor"/>
            </svg>
          )}
        </button>
        <button className={`${styles.btn} ${styles.stepBtn}`} aria-label="Следующий" onClick={next}>
          <svg width="15" height="15" viewBox="0 0 16 16">
            <path d="M11 3 v10 M3 3 L10 8 L3 13 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className={styles.meta}>
        <span className={`${styles.kind} ${gold ? styles.kindGold : ''}`}>{tr ? tr.subtitle : ''}</span>
        <span className={styles.name}>{tr ? tr.title : ''}</span>
      </div>

      <div className={styles.scrubWrap}>
        <span className={styles.time}>{fmtSec(drag != null ? drag * total : st.t)}</span>
        <div
          className={styles.scrub}
          ref={scrubRef}
          onPointerDown={onScrubDown}
          onPointerMove={onScrubMove}
          onPointerUp={onScrubUp}
          onPointerCancel={onScrubUp}
        >
          <div className={styles.rail} />
          <div className={`${styles.fill} ${gold ? styles.fillGold : ''}`} style={{ width: `${progress * 100}%` }} />
          <div className={`${styles.knob} ${gold ? styles.knobGold : ''}`} style={{ left: `${progress * 100}%` }} />
        </div>
        <span className={styles.time}>{tr ? tr.duration : '0:00'}</span>
      </div>

      <div className={styles.actions}>
        <div className={`${styles.volWrap} ${volOpen ? styles.volWrapOpen : ''}`} ref={volRef}>
          <button className={styles.iconBtn} aria-label="Громкость" onClick={() => setVolOpen(o => !o)}>
            <svg width="18" height="18" viewBox="0 0 20 20">
              <path d="M3 7.5 h3 L10.5 4 v12 L6 12.5 H3 Z" fill="currentColor"/>
              <path d="M13.5 7 a4 4 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
          <div className={`${styles.volPop} ${volOpen ? styles.volPopOpen : ''}`}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={st.volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
            />
          </div>
        </div>
        <button className={styles.iconBtn} aria-label="Закрыть плеер" onClick={close}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
