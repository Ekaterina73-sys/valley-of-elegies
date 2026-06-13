'use client';

import { useRef, useEffect } from 'react';
import FlourishScroll from './Flourish';
import styles from './HomeQuote.module.css';

export default function HomeQuote() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // При отключённой анимации — сразу показываем всё
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add(styles.visible);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(styles.visible);
          obs.disconnect();
        }
      },
      { threshold: 0.22 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const quote = '«Удивительное дело — чем меньше торопишься, тем больше успеваешь замечать.»';
  const GAP_MS = 28; // задержка между буквами, мс

  return (
    <section ref={sectionRef} className={`container-narrow ${styles.quote}`}>
      <div className={styles.flourishTop}>
        <FlourishScroll size={260} />
      </div>

      <p className={styles.text} aria-label={quote}>
        {[...quote].map((char, i) => (
          <span
            key={i}
            data-qletter=""
            aria-hidden="true"
            style={{ '--ld': `${i * GAP_MS}ms` } as React.CSSProperties}
          >{char}</span>
        ))}
      </p>

      <div className={`hand ${styles.author}`}>— Мистер Пипинс</div>

      <div className={styles.flourishBottom}>
        <FlourishScroll size={260} flip />
      </div>
    </section>
  );
}
