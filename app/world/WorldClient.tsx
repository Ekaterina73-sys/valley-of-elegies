'use client';

import { useState } from 'react';
import type { WorldCard } from '@/lib/content';
import WorldCardComponent from '@/components/WorldCardComponent';
import CardModal from '@/components/CardModal';
import { cardStyles } from '@/components/CardFrame';

export default function WorldClient({ worldCards }: { worldCards: WorldCard[] }) {
  const [open, setOpen] = useState<WorldCard | null>(null);

  return (
    <>
      <div className={cardStyles.cards}>
        {worldCards.map((item, i) => (
          <WorldCardComponent
            key={item.slug}
            item={item}
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
          раздел пополняется
        </p>
      </div>

      <CardModal
        open={!!open}
        kind="world"
        item={open}
        onClose={() => setOpen(null)}
      />
    </>
  );
}
