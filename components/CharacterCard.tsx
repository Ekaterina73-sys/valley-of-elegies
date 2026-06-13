'use client';

import Image from 'next/image';
import type { Character } from '@/lib/content';
import { useTilt, CardFrame, cardStyles as styles } from './CardFrame';

type Props = {
  character: Character;
  index: number;
  onOpen: (c: Character) => void;
};

export default function CharacterCard({ character, index, onOpen }: Props) {
  const tilt = useTilt(10);
  const eyebrow = (character.role || 'житель').toUpperCase();

  return (
    <button
      className={styles.card}
      style={{ animationDelay: `${0.25 + index * 0.08}s` }}
      {...tilt}
      onClick={() => onOpen(character)}
      aria-label={`Открыть карточку: ${character.name}`}
    >
      <CardFrame character>
        <div className={styles.eyebrow}>/ {eyebrow}</div>
        <div className={styles.imageCircle}>
          {(character.imagePreview || character.image) ? (
            <div style={{ width: '60%', aspectRatio: '1/1', position: 'relative', flexShrink: 0 }}>
              {/* Clip circle */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%', overflow: 'hidden',
                border: '1px solid rgba(176,140,56,0.65)',
              }}>
                {character.imagePreview ? (
                  <Image
                    src={character.imagePreview}
                    alt={character.name}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    sizes="200px"
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.3)', transformOrigin: '50% 0%' }}>
                    <Image
                      src={character.image!}
                      alt={character.name}
                      fill
                      style={{ objectFit: 'contain', objectPosition: 'center top' }}
                      sizes="200px"
                    />
                  </div>
                )}
              </div>
              {/* Medallion decoration */}
              <svg
                aria-hidden="true"
                style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', overflow: 'visible' }}
                viewBox="-50 -50 100 100"
              >
                <circle cx="0" cy="0" r="54" fill="none" stroke="rgba(176,140,56,0.22)" strokeWidth="0.8"/>
                <circle cx="0" cy="0" r="57.5" fill="none" stroke="rgba(176,140,56,0.1)" strokeWidth="0.8"/>
                <circle cx="0" cy="-57.5" r="3" fill="none" stroke="rgba(176,140,56,0.65)" strokeWidth="0.9"/>
                <line x1="-3" y1="-57.5" x2="-8" y2="-57.5" stroke="rgba(176,140,56,0.5)" strokeWidth="0.9"/>
                <line x1="3" y1="-57.5" x2="8" y2="-57.5" stroke="rgba(176,140,56,0.5)" strokeWidth="0.9"/>
              </svg>
            </div>
          ) : (
            <div style={{ width: '60%', aspectRatio: '1/1', position: 'relative', flexShrink: 0 }}>
              <div className={styles.vignette} style={{ position: 'absolute', inset: 0, width: 'auto', height: 'auto' }}>
                виньетка<br />{character.name.split(' ')[0]}
              </div>
              <svg
                aria-hidden="true"
                style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', overflow: 'visible' }}
                viewBox="-50 -50 100 100"
              >
                <circle cx="0" cy="0" r="54" fill="none" stroke="rgba(176,140,56,0.22)" strokeWidth="0.8"/>
                <circle cx="0" cy="0" r="57.5" fill="none" stroke="rgba(176,140,56,0.1)" strokeWidth="0.8"/>
                <circle cx="0" cy="-57.5" r="3" fill="none" stroke="rgba(176,140,56,0.65)" strokeWidth="0.9"/>
                <line x1="-3" y1="-57.5" x2="-8" y2="-57.5" stroke="rgba(176,140,56,0.5)" strokeWidth="0.9"/>
                <line x1="3" y1="-57.5" x2="8" y2="-57.5" stroke="rgba(176,140,56,0.5)" strokeWidth="0.9"/>
              </svg>
            </div>
          )}
        </div>
        <h3 className={styles.name} style={{ textAlign: 'center' }}>{character.name}</h3>
        <div className={styles.cardQuote} aria-hidden="true">
          <span className={styles.cardQuoteRule} />
          <span className={styles.cardQuoteGlyph}>❧</span>
          <span className={styles.cardQuoteRule} />
        </div>
      </CardFrame>
    </button>
  );
}
