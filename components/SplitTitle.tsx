import type { CSSProperties } from 'react';

interface SplitTitleProps {
  text: string;
  /** Задержка первой буквы, мс */
  baseDelay: number;
  /** Шаг между буквами, мс */
  letterGap: number;
  tag?: 'span' | 'em';
  className?: string;
}

/**
 * Разбивает слово на буквы с каскадной задержкой для intro-анимации.
 * Каждая буква получает CSS-переменную --ld (letter delay).
 * aria-label на обёртке — читалки произносят слово целиком.
 */
export default function SplitTitle({
  text,
  baseDelay,
  letterGap,
  tag: Tag = 'span',
  className,
}: SplitTitleProps) {
  return (
    <Tag className={className} aria-label={text}>
      {[...text].map((char, i) => (
        <span
          key={i}
          data-letter=""
          aria-hidden="true"
          style={{ '--ld': `${baseDelay + i * letterGap}ms` } as CSSProperties}
        >
          {char}
        </span>
      ))}
    </Tag>
  );
}
