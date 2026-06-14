'use client';

import { useState, useMemo } from 'react';
import type { EvangelineTrack } from '@/lib/content';
import { VINYL_LABEL_HUES } from '@/lib/config';
import { usePlayer, musicToTrack } from './PlayerStore';
import styles from './VinylCollection.module.css';

type EnrichedTrack = EvangelineTrack & { labelHue: typeof VINYL_LABEL_HUES[number]; displaySide: string };

function pluralRec(n: number): string {
  const mod100 = n % 100;
  const mod10 = mod100 % 10;
  if (mod100 > 10 && mod100 < 20) return 'пластинок';
  if (mod10 === 1) return 'пластинка';
  if (mod10 >= 2 && mod10 <= 4) return 'пластинки';
  return 'пластинок';
}

export default function VinylCollection({ tracks: rawTracks }: { tracks: EvangelineTrack[] }) {
  const { state: pstate, play, toggle } = usePlayer();
  const [activeTrack, setActiveTrack] = useState<EnrichedTrack | null>(null);

  const tracks = useMemo(
    () => rawTracks.map((t, i): EnrichedTrack => ({
      ...t,
      labelHue: VINYL_LABEL_HUES[i % VINYL_LABEL_HUES.length],
      displaySide: (i % 2 === 0) ? 'A · 33⅓' : 'B · 33⅓',
    })),
    [rawTracks]
  );

  const handlePlay = (tr: EnrichedTrack) => {
    const track = musicToTrack(tr);
    const isActive = pstate.track?.id === track.id;
    if (isActive) {
      toggle();
    } else {
      play(track);
    }
  };

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <div className={styles.titleBlock}>
          <div className={styles.eyebrowGold}>valley of elegies records</div>
          <h2 className={styles.title}>
            <span style={{ fontFamily: "'Bogart', var(--ff-display)", fontWeight: 700 }}>Коллекция</span>{' '}
            <em>Эванджелин</em>
          </h2>
          <p className={styles.sub}>
            Собрание сочинений Эванджелин, присланных на радио Долины элегий.
          </p>
        </div>
        <div className={styles.stamp}>
          <div className={styles.stampRow}>
            <b>{tracks.length}</b>
            {pluralRec(tracks.length)}
          </div>
          <div style={{ marginTop: '0.6rem' }}>
            MMXXVI · приватный архив
          </div>
        </div>
      </header>

      <div className={styles.stripWrap}>
        <div className={styles.strip}>
          {tracks.map((tr) => {
            const trackObj = musicToTrack(tr);
            const isActive = pstate.track?.id === trackObj.id;
            const isPlaying = isActive && pstate.playing;
            return (
              <div
                key={tr.number}
                className={styles.record}
                role="button"
                tabIndex={0}
                data-active={isActive ? '1' : '0'}
                data-playing={isPlaying ? '1' : '0'}
                data-hue={tr.labelHue}
                onClick={() => setActiveTrack(tr)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTrack(tr);
                  }
                }}
              >
                <div className={styles.disc}>
                  <div className={styles.label}>
                    <span className={styles.lblMark}>Valley of Elegies</span>
                    <span className={styles.lblTitle}>{tr.title}</span>
                    <span className={styles.lblHole} aria-hidden="true" />
                    <span className={styles.lblMeta}>{tr.displaySide}</span>
                  </div>
                </div>
                <button
                  className={styles.playBtn}
                  aria-label="Слушать пластинку"
                  data-playing={isPlaying ? '1' : '0'}
                  onClick={(e) => { e.stopPropagation(); handlePlay(tr); }}
                >
                  {isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 12 12">
                      <rect x="2.5" y="2" width="2.2" height="8" rx="0.5" fill="currentColor"/>
                      <rect x="7.3" y="2" width="2.2" height="8" rx="0.5" fill="currentColor"/>
                    </svg>
                  ) : (
                    <svg width="19" height="19" viewBox="0 0 12 12" style={{ marginLeft: 2 }}>
                      <path d="M2.5 1.5 L10.5 6 L2.5 10.5 Z" fill="currentColor"/>
                    </svg>
                  )}
                </button>
                <div className={styles.foot}>
                  <div className={styles.numAndSide}>
                    <span className={styles.recNum}>№ {String(tr.number).padStart(2, '0')}</span>
                    <span className={styles.recSide}>{tr.displaySide}</span>
                  </div>
                  <div className={styles.recTitle}>{tr.title}</div>
                </div>
              </div>
            );
          })}

          {/* Placeholder "Coming soon" record */}
          <div className={styles.recordBlur}>
            <div className={styles.blurDisc}>
              <div className={styles.discFake} aria-hidden="true" />
              <div className={styles.soonVeil} aria-hidden="true" />
              <div className={styles.soonBadge}>
                <svg className={styles.soonLock} width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.2" fill="currentColor" opacity="0.95"/>
                  <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <circle cx="12" cy="15.4" r="1.5" fill="#1c1610"/>
                  <rect x="11.25" y="15.4" width="1.5" height="3" rx="0.75" fill="#1c1610"/>
                </svg>
                <span className={styles.soonText}>Скоро</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.announcement}>
        Следующая запись — лето MMXXVI
      </div>
    </section>
  );
}
