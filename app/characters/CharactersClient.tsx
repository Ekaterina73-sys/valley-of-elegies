'use client';

import { useState, useEffect } from 'react';
import type { Character } from '@/lib/content';
import CharacterCard from '@/components/CharacterCard';
import CardModal from '@/components/CardModal';
import { cardStyles } from '@/components/CardFrame';

export default function CharactersClient({ characters }: { characters: Character[] }) {
  const [open, setOpen] = useState<Character | null>(null);

  // Тихо подгружаем полные изображения персонажей в простое браузера —
  // чтобы при клике по карточке модалка открывалась с готовой картинкой.
  // Превью карточек грузятся отдельно (priority), поэтому прогрев не мешает им.
  useEffect(() => {
    const fulls = characters.map(c => c.image).filter(Boolean) as string[];
    if (fulls.length === 0) return;
    let cancelled = false;
    const preload = () => {
      if (cancelled) return;
      for (const src of fulls) {
        const img = new window.Image();
        img.src = src;
      }
    };
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(preload, { timeout: 2500 })
      : window.setTimeout(preload, 1500);
    return () => {
      cancelled = true;
      if (w.requestIdleCallback && w.cancelIdleCallback) w.cancelIdleCallback(id);
      else clearTimeout(id as number);
    };
  }, [characters]);

  return (
    <>
      <div className={cardStyles.cards}>
        {characters.map((c, i) => (
          <CharacterCard
            key={c.slug}
            character={c}
            index={i}
            onOpen={setOpen}
            priority={i < 4}
          />
        ))}
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <div className="kb-section-orn" aria-hidden="true">
          <span className="kb-section-orn-rule" />
          <span className="kb-section-orn-glyph">✦</span>
          <span className="kb-section-orn-rule" />
        </div>
        <p style={{
          fontFamily: 'var(--ff-display)',
          fontStyle: 'italic',
          fontSize: '1.3rem',
          letterSpacing: '0.01em',
          color: 'var(--ink-soft)',
        }}>
          …и кое-кто ещё.
        </p>
      </div>

      <CardModal
        open={!!open}
        kind="resident"
        item={open}
        onClose={() => setOpen(null)}
      />
    </>
  );
}
