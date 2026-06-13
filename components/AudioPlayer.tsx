'use client';

import { useRef } from 'react';
import { usePlayer, epToTrack } from './PlayerStore';
import { fmtSec } from '@/lib/utils';
import type { RadioEpisode } from '@/lib/content';
import styles from './AudioPlayer.module.css';

type Props = {
  episode: RadioEpisode;
  variant?: 'compact' | 'full' | 'round';
  autoplay?: boolean;
};

function Scrubber({ progress, onScrub, thin = false }: { progress: number; onScrub: (e: React.PointerEvent) => void; thin?: boolean }) {
  const dragging = useRef(false);
  const down = (e: React.PointerEvent) => {
    dragging.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    onScrub(e);
  };
  const move = (e: React.PointerEvent) => { if (dragging.current) onScrub(e); };
  const end = (e: React.PointerEvent) => {
    dragging.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };
  const h = thin ? 3 : 5;
  const knobSize = thin ? 10 : 14;
  return (
    <div
      className={styles.scrubber}
      style={{ height: h, background: 'var(--scrub-track, color-mix(in oklab, var(--ink) 14%, transparent))' }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className={styles.scrubFill} style={{ width: `${progress * 100}%` }} />
      <div
        className={styles.scrubKnob}
        style={{
          left: `${progress * 100}%`,
          width: knobSize,
          height: knobSize,
        }}
      />
    </div>
  );
}

function PlayBtn({ playing, onToggle, size = 48 }: { playing: boolean; onToggle: () => void; size?: number }) {
  return (
    <button
      className={styles.playBtn}
      onClick={onToggle}
      aria-label={playing ? 'Пауза' : 'Играть'}
      style={{ width: size, height: size }}
    >
      {playing ? (
        <svg width={size * 0.34} height={size * 0.34} viewBox="0 0 12 12">
          <rect x="2" y="1.5" width="2.6" height="9" rx="0.6" fill="currentColor"/>
          <rect x="7.4" y="1.5" width="2.6" height="9" rx="0.6" fill="currentColor"/>
        </svg>
      ) : (
        <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 12 12" style={{ marginLeft: '2px' }}>
          <path d="M2.5 1.5 L 10.5 6 L 2.5 10.5 Z" fill="currentColor"/>
        </svg>
      )}
    </button>
  );
}

export default function AudioPlayer({ episode, variant = 'compact', autoplay = false }: Props) {
  const { state: pstate, play, toggle, seekFrac } = usePlayer();
  const track = epToTrack(episode);
  const total = track.totalSec;
  const isActive = pstate.track?.id === track.id;
  const playing = !!(isActive && pstate.playing);
  const t = isActive ? pstate.t : 0;
  // When active, use the real duration from the store (updated via loadedmetadata)
  const realTotalSec = isActive && pstate.track ? pstate.track.totalSec : total;
  const realDuration = isActive && pstate.track ? pstate.track.duration : episode.duration;
  const progress = realTotalSec ? t / realTotalSec : 0;

  const onToggle = () => {
    if (isActive) toggle();
    else play(track);
  };

  const onScrub = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (!isActive) play(track);
    seekFrac(Math.max(0, Math.min(1, x)));
  };

  if (variant === 'round') {
    return (
      <div className={styles.round}>
        <span className={styles.roundEyebrow}>эпизод № {episode.episode}</span>
        <PlayBtn playing={playing} onToggle={onToggle} size={48} />
        <div className={styles.roundTitle}>{episode.title}</div>
        <div className={styles.roundScrub}>
          <Scrubber progress={progress} onScrub={onScrub} thin />
        </div>
        <span className={styles.roundTime}>{fmtSec(t)} / {realDuration}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={styles.compact}>
        <PlayBtn playing={playing} onToggle={onToggle} size={36} />
        <div className={styles.compactMeta}>
          <div className={styles.compactTop}>
            <span className={styles.compactTitle}>
              №{episode.episode}. {episode.title}
            </span>
            <span className={styles.compactTime}>
              {fmtSec(t)} / {realDuration}
            </span>
          </div>
          <Scrubber progress={progress} onScrub={onScrub} thin />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.full}>
      <PlayBtn playing={playing} onToggle={onToggle} size={56} />
      <div style={{ minWidth: 0 }}>
        <div className={styles.fullMeta}>
          <span className={styles.fullEpNum}>эпизод № {episode.episode}</span>
          <span className={styles.fullTime}>{fmtSec(t)} / {realDuration}</span>
        </div>
        <div className={styles.fullTitle}>{episode.title}</div>
        <Scrubber progress={progress} onScrub={onScrub} />
      </div>
    </div>
  );
}
