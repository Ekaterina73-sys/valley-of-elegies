'use client';

import type { WorldCard } from '@/lib/content';
import { useTilt, CardFrame, cardStyles as styles } from './CardFrame';

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

type Props = {
  item: WorldCard;
  index: number;
  onOpen: (item: WorldCard) => void;
};

export default function WorldCardComponent({ item, index, onOpen }: Props) {
  const tilt = useTilt(10);
  const glyph = WORLD_GLYPHS[item.type] || '✦';
  const label = WORLD_LABELS[item.type] || item.type;

  return (
    <button
      className={styles.card}
      style={{ animationDelay: `${0.25 + index * 0.08}s` }}
      {...tilt}
      onClick={() => onOpen(item)}
      aria-label={`Открыть карточку: ${item.title}`}
    >
      <CardFrame world>
        <div className={styles.tab}>
          <i>{glyph}</i> {label}
        </div>
        <div className={styles.eyebrow}>&nbsp;</div>
        <div className={styles.center}>
          <h3 className={styles.name}>{item.title}</h3>
          <p className={styles.role}>{item.subtitle}</p>
        </div>
        <div className={styles.orn} aria-hidden="true">
          <span className={styles.ornRule} />
          <span className={styles.ornGlyph}>{glyph}</span>
          <span className={styles.ornRule} />
        </div>
      </CardFrame>
    </button>
  );
}
