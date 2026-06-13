'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { RadioEpisode, EvangelineTrack } from '@/lib/content';
import AudioPlayer from './AudioPlayer';
import VinylCollection from './VinylCollection';
import { usePlayer, epToTrack } from './PlayerStore';
import styles from './EpisodeList.module.css';

type Props = { episodes: RadioEpisode[]; tracks: EvangelineTrack[] };

export default function EpisodeList({ episodes, tracks }: Props) {
  const { state: pstate, play, toggle } = usePlayer();

  const sortedEps = useMemo(
    () => [...episodes].sort((a, b) => a.episode - b.episode),
    [episodes]
  );

  const [activeEp, setActiveEp] = useState(sortedEps[0]);

  const handlePlay = (ep: RadioEpisode) => {
    const track = epToTrack(ep);
    const isActive = pstate.track?.id === track.id;
    if (isActive) {
      toggle();
    } else {
      play(track);
    }
  };

  return (
    <div>
      <div className={styles.grid}>
        {/* Episode list */}
        <div className={styles.epList}>
          {sortedEps.map((ep, index) => {
            const track = epToTrack(ep);
            const isActive = pstate.track?.id === track.id;
            const isPlaying = isActive && pstate.playing;
            return (
              <div
                key={ep.slug}
                className={styles.epRow}
                style={{ animationDelay: `${0.2 + index * 0.10}s` }}
                role="button"
                tabIndex={0}
                data-active={activeEp.slug === ep.slug ? '1' : '0'}
                data-playing={isPlaying ? '1' : '0'}
                onClick={() => setActiveEp(ep)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveEp(ep);
                  }
                }}
              >
                <span className={styles.epNum}>{String(ep.episode).padStart(2, '0')}</span>
                <div className={styles.epBody}>
                  <div className={styles.epTitle}>{ep.title}</div>
                  <div className={styles.epMeta}>{ep.date}{ep.duration ? ` · ${ep.duration}` : ''}</div>
                  <p className={styles.epTease}>{ep.description}</p>
                </div>
                <button
                  className={styles.epPlay}
                  aria-label="Слушать выпуск"
                  onClick={(e) => { e.stopPropagation(); handlePlay(ep); }}
                >
                  {isPlaying ? (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <rect x="2.5" y="2" width="2.2" height="8" rx="0.5" fill="currentColor"/>
                      <rect x="7.3" y="2" width="2.2" height="8" rx="0.5" fill="currentColor"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 12 12">
                      <path d="M2.5 1.5 L 10.5 6 L 2.5 10.5 Z" fill="currentColor" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Episode detail */}
        <aside className={styles.epDetail}>
          <div className={styles.service}>
            <span>эпизод № {activeEp.episode}</span>
            <span>{activeEp.date}{activeEp.duration ? ` · ${activeEp.duration}` : ''}</span>
          </div>
          <h2 className={styles.epDetailTitle}>{activeEp.title}</h2>
          <AudioPlayer episode={activeEp} key={'ep-' + activeEp.slug} variant="full" />
          <p className={styles.epDesc}>{activeEp.description}</p>
        </aside>
      </div>

      {/* Platforms link */}
      <div className={styles.platformsLink}>
        <Link href="/about#platforms">
          Слушать на платформах →
        </Link>
      </div>

      {/* Vinyl collection */}
      <VinylCollection tracks={tracks} />
    </div>
  );
}
