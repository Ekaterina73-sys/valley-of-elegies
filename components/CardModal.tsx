'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { Character, WorldCard } from '@/lib/content';
import { usePlayer, worldSoundToTrack } from './PlayerStore';
import { fmtSec } from '@/lib/utils';
import styles from './CardModal.module.css';
import { cfInnerPath, CF_W, CF_H } from './CardFrame';

function SoundCardPlayer({ card }: { card: WorldCard }) {
  const { state: pstate, play, toggle, seekFrac } = usePlayer();
  const dragging = useRef(false);

  const track = worldSoundToTrack(card);
  const isActive = pstate.track?.id === track.id;
  const playing = isActive && pstate.playing;
  const t = isActive ? pstate.t : 0;
  const totalSec = isActive && pstate.track ? pstate.track.totalSec : 0;
  const duration = isActive && pstate.track ? pstate.track.duration : '—';
  const progress = totalSec ? t / totalSec : 0;

  const onToggle = () => { isActive ? toggle() : play(track); };

  const getFrac = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  return (
    <div className={styles.soundPlayer}>
      <button
        className={styles.soundPlayBtn}
        onClick={onToggle}
        aria-label={playing ? 'Пауза' : 'Играть'}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 12 12">
            <rect x="2" y="1.5" width="2.6" height="9" rx="0.6" fill="currentColor"/>
            <rect x="7.4" y="1.5" width="2.6" height="9" rx="0.6" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 12 12" style={{ marginLeft: '2px' }}>
            <path d="M2.5 1.5 L 10.5 6 L 2.5 10.5 Z" fill="currentColor"/>
          </svg>
        )}
      </button>
      <div className={styles.soundMeta}>
        <div className={styles.soundTop}>
          <span className={styles.soundTitle}>{card.title}</span>
          <span className={styles.soundTime}>{fmtSec(t)} / {duration}</span>
        </div>
        <div
          className={styles.soundScrub}
          onPointerDown={(e) => {
            dragging.current = true;
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
            if (!isActive) play(track);
            seekFrac(getFrac(e));
          }}
          onPointerMove={(e) => { if (dragging.current) seekFrac(getFrac(e)); }}
          onPointerUp={(e) => {
            dragging.current = false;
            try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
          }}
          onPointerCancel={() => { dragging.current = false; }}
        >
          <div className={styles.soundRail} />
          <div className={styles.soundFill} style={{ width: `${progress * 100}%` }} />
          <div className={styles.soundKnob} style={{ left: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

const WORLD_GLYPHS: Record<string, string> = {
  place:   '▲',
  object:  '◈',
  event:   '✦',
  recipe:  '❦',
  sound:   '♪',
  fact:    '◉',
};

const WORLD_LABELS: Record<string, string> = {
  place:   'место',
  object:  'предмет',
  event:   'событие',
  recipe:  'рецепт',
  sound:   'звук',
  fact:    'факт',
};

type ModalItem = Character | WorldCard;

type Props = {
  open: boolean;
  kind: 'resident' | 'world' | null;
  item: ModalItem | null;
  onClose: () => void;
};

function isCharacter(item: ModalItem, kind: 'resident' | 'world' | null): item is Character {
  return kind === 'resident';
}

export default function CardModal({ open, kind, item, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  const isResident = isCharacter(item, kind);
  let title = '', role = '', text = '';
  let eyebrow = '';

  if (isResident) {
    const c = item as Character;
    title = c.name;
    role = c.occupation || '';
    text = c.description || '';
    eyebrow = `/ ${(c.role || 'житель').toUpperCase()}`;
  } else {
    const w = item as WorldCard;
    const glyph = WORLD_GLYPHS[w.type] || '✦';
    const label = WORLD_LABELS[w.type] || w.type;
    title = w.title;
    role = w.subtitle || '';
    text = w.content || '';
    eyebrow = `${glyph}  ${label.toUpperCase()}`;
  }

  const paragraphs = text.split('\n\n').filter(Boolean);
  const fallbackText = 'Здесь должна быть подробная история, но мы пока её рассказываем шёпотом — приходите позже, мы запишем.';

  return createPortal(
    <div
      className={styles.scrim}
      data-open={open ? '1' : '0'}
      onClick={onClose}
    >
      <div className={styles.shell} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalCf}>
          <svg
            className={styles.cardLine}
            viewBox={`0 0 ${CF_W} ${CF_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={cfInnerPath()} />
          </svg>
          <div className={styles.body}>
            <div>
              {isResident ? (
                (item as Character).image ? (
                  <div className={styles.charImage}>
                    <Image
                      src={(item as Character).image!}
                      alt={(item as Character).name}
                      fill
                      priority
                      style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
                      sizes="500px"
                    />
                  </div>
                ) : (
                  <div className={styles.vignette}>
                    виньетка<br />{(item as Character).name.split(' ')[0]}
                  </div>
                )
              ) : (
                (item as WorldCard).image ? (
                  <div className={styles.worldImage}>
                    <Image
                      src={(item as WorldCard).image!}
                      alt={(item as WorldCard).title}
                      fill
                      priority
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                      sizes="300px"
                    />
                  </div>
                ) : null
              )}
            </div>
            <div>
              {!isResident && <div className={styles.eyebrow}>{eyebrow}</div>}
              <h2 className={styles.name}>{title}</h2>
              {role && <p className={styles.roleText}>{role}</p>}
              <div className={styles.text}>
                {(paragraphs.length > 0 ? paragraphs : [fallbackText]).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {isResident && (item as Character).quote && (
                <blockquote className={styles.quote}>
                  «{(item as Character).quote}»
                </blockquote>
              )}
              {!isResident && (item as WorldCard).type === 'sound' && (item as WorldCard).audio && (
                <SoundCardPlayer card={item as WorldCard} />
              )}
            </div>
          </div>
        </div>
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  );
}
