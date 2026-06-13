'use client';

import { useState } from 'react';
import type { Character } from '@/lib/content';
import CharacterCard from '@/components/CharacterCard';
import CardModal from '@/components/CardModal';
import { cardStyles } from '@/components/CardFrame';

export default function CharactersClient({ characters }: { characters: Character[] }) {
  const [open, setOpen] = useState<Character | null>(null);

  return (
    <>
      <div className={cardStyles.cards}>
        {characters.map((c, i) => (
          <CharacterCard
            key={c.slug}
            character={c}
            index={i}
            onOpen={setOpen}
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
